const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Preserve the lightweight file-based routes for compatibility
app.use('/api/tenders', require('./routes/tenders'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/billing', require('./routes/billing'));

// New Mongo-backed routes
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/orders', require('./routes/orders'));

// Optional: simple health-check
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Socket.io setup for real-time events (bids, chat, driver location)
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

io.on('connection', (socket) => {
  // allow clients to join auction rooms
  socket.on('join:auction', (auctionId) => {
    socket.join(`auction_${auctionId}`);
  });
  socket.on('leave:auction', (auctionId) => socket.leave(`auction_${auctionId}`));

  socket.on('chat:message', (payload) => {
    // broadcast chat to order room
    if (payload && payload.orderId) {
      io.to(`order_${payload.orderId}`).emit('chat:message', payload);
    }
  });

  socket.on('join:order', (orderId) => socket.join(`order_${orderId}`));

  socket.on('driver:location', (payload) => {
    // payload: { orderId, lat, lng }
    if (payload && payload.orderId) io.to(`order_${payload.orderId}`).emit('driver:location', payload);
  });
});

// Connect to MongoDB (if MONGO_URI provided)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/truck_rental';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => console.warn('MongoDB not available, running in file-mode', err.message));

server.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
