const mongoose = require('mongoose');
const { Schema } = mongoose;

const BidSchema = new Schema({
  auction: { type: Schema.Types.ObjectId, ref: 'Auction', required: true },
  partnerId: { type: String, required: true },
  partnerName: String,
  amount: { type: Number, required: true },
  etaMinutes: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bid', BidSchema);
