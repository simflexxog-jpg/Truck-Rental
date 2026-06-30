const mongoose = require('mongoose');
const { Schema } = mongoose;

const GeoPoint = {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
};

const OrderSchema = new Schema({
  auction: { type: Schema.Types.ObjectId, ref: 'Auction', required: true },
  bid: { type: Schema.Types.ObjectId, ref: 'Bid', required: true },
  customerId: String,
  partnerId: String,
  origin: GeoPoint,
  destination: GeoPoint,
  status: { type: String, enum: ['pending','in_transit','completed','cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

OrderSchema.index({ origin: '2dsphere', destination: '2dsphere' });

module.exports = mongoose.model('Order', OrderSchema);
