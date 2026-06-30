const mongoose = require('mongoose');
const { Schema } = mongoose;

const AddOnMatchSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  auctionId: { type: Schema.Types.ObjectId, ref: 'Auction', required: true },
  extraDetourMeters: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AddOnMatch', AddOnMatchSchema);
