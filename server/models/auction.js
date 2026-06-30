const mongoose = require('mongoose');
const { Schema } = mongoose;

const GeoPoint = {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], index: '2dsphere', required: true } // [lng, lat]
};

const AuctionSchema = new Schema({
  title: String,
  customerId: { type: String, required: true },
  origin: GeoPoint,
  destination: GeoPoint,
  cargo: Schema.Types.Mixed,
  vehicleType: String,
  auctionEndsAt: Date,
  status: { type: String, enum: ['open','assigned','closed','cancelled'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  bids: [{ type: Schema.Types.ObjectId, ref: 'Bid' }]
});

AuctionSchema.index({ 'origin': '2dsphere' });
AuctionSchema.index({ 'destination': '2dsphere' });

module.exports = mongoose.model('Auction', AuctionSchema);
