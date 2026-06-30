const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatMessageSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  senderId: String,
  senderName: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
