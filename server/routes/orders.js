const express = require('express');
const router = express.Router();
const Auction = require('../models/auction');
const Order = require('../models/order');
const AddOnMatch = require('../models/addonmatch');
const { calculateExtraDetourMeters } = require('../utils/detour');

// GET /api/orders/:id/addon-matches
router.get('/:id/addon-matches', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ error: 'order not found' });

    // Pre-filter by geo: find open auctions whose origin is near the order route origin/destination within ~5km
    // Use $geoNear for efficient spatial filtering
    const OrderRoute = {
      origin: { lat: order.origin.coordinates[1], lng: order.origin.coordinates[0] },
      destination: { lat: order.destination.coordinates[1], lng: order.destination.coordinates[0] }
    };

    // Find candidate auctions near the order's origin
    const candidates = await Auction.aggregate([
      { $match: { status: 'open', auctionEndsAt: { $gt: new Date() } } },
      { $geoNear: { near: { type: 'Point', coordinates: [order.origin.coordinates[0], order.origin.coordinates[1]] }, distanceField: 'dist', maxDistance: 5000, spherical: true } },
      { $limit: 50 }
    ]);

    const matches = [];
    for (const a of candidates) {
      const pickup = { lat: a.origin.coordinates[1], lng: a.origin.coordinates[0] };
      const drop = { lat: a.destination.coordinates[1], lng: a.destination.coordinates[0] };
      const extra = await calculateExtraDetourMeters(OrderRoute, pickup, drop);
      // only accept add-ons that add <= 2000 meters
      if (extra <= 2000) {
        matches.push({ auctionId: a._id, extraDetourMeters: extra, auction: a });
      }
    }

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;
