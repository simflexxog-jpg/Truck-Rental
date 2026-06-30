const express = require('express');
const router = express.Router();
const Auction = require('../models/auction');
const Bid = require('../models/bid');
const Order = require('../models/order');
const mongoose = require('mongoose');

// Create auction (customer)
router.post('/', async (req, res) => {
  try {
    const { title, customerId, origin, destination, cargo, vehicleType, durationMinutes } = req.body;
    const auction = new Auction({
      title,
      customerId,
      origin: { type: 'Point', coordinates: [origin.lng, origin.lat] },
      destination: { type: 'Point', coordinates: [destination.lng, destination.lat] },
      cargo,
      vehicleType,
      auctionEndsAt: new Date(Date.now() + (durationMinutes || 60) * 60000)
    });
    await auction.save();
    res.json(auction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// GET open auctions feed (partners) - supports vehicleType and location filtering
router.get('/open', async (req, res) => {
  try {
    const { vehicleType, lat, lng, radiusMeters } = req.query;
    const q = { status: 'open', auctionEndsAt: { $gt: new Date() } };
    if (vehicleType) q.vehicleType = vehicleType;

    if (lat && lng) {
      const center = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
      const meters = parseInt(radiusMeters || '50000', 10);
      q.origin = { $near: { $geometry: center, $maxDistance: meters } };
    }

    const auctions = await Auction.find(q).limit(100).lean();
    res.json(auctions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Partner places a bid
router.post('/:id/bids', async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerId, partnerName, amount, etaMinutes } = req.body;
    const auction = await Auction.findById(id);
    if (!auction || auction.status !== 'open') return res.status(404).json({ error: 'not open' });

    const bid = new Bid({ auction: auction._id, partnerId, partnerName, amount, etaMinutes });
    await bid.save();
    auction.bids.push(bid._id);
    await auction.save();

    // Emit real-time update via socket.io if available
    if (req.app.get('io')) {
      req.app.get('io').to(`auction_${id}`).emit('bid:created', { auctionId: id, bid });
    }

    res.json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Customer accepts a bid -> create Order
router.post('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { bidId } = req.body;
    const auction = await Auction.findById(id).populate('bids');
    if (!auction) return res.status(404).json({ error: 'auction not found' });
    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ error: 'bid not found' });

    auction.status = 'assigned';
    await auction.save();

    const order = new Order({
      auction: auction._id,
      bid: bid._id,
      customerId: auction.customerId,
      partnerId: bid.partnerId,
      origin: auction.origin,
      destination: auction.destination,
      status: 'pending'
    });
    await order.save();

    // Notify via socket
    if (req.app.get('io')) {
      req.app.get('io').emit('auction:assigned', { auctionId: id, order });
    }

    res.json({ auction, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;
