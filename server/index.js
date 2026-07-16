const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { logger } = require('./logger');
const { authMiddleware } = require('./middleware/auth');
const { applySecurityMiddleware } = require('./middleware/security');
const { initializeSentry } = require('./sentry');
const { attachSocketAdapter } = require('./socket/adapter');

initializeSentry();

const app = express();
const httpServer = http.createServer(app);

applySecurityMiddleware(app);
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:4200',
  'http://localhost:63720',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:63720',
  'http://localhost:64041',
  'http://127.0.0.1:64041'
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(authMiddleware);

// Preserve the lightweight file-based routes for compatibility
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenders', require('./routes/tenders'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/billing', require('./routes/billing'));

// New Mongo-backed routes
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/orders', require('./routes/orders'));
app.use('/health', require('./routes/health'));

const PORT = process.env.PORT || 3000;

// Socket.io setup for real-time events (bids, chat, driver location)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});
app.set('io', io);
attachSocketAdapter(io);

io.on('connection', (socket) => {
  socket.on('join-room', (room) => {
    if (room === 'customer' || room === 'partner') {
      socket.join(room);
    }
  });

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
  logger.info('Connected to MongoDB');
}).catch(err => logger.warn('MongoDB not available, running in file-mode', { error: err.message }));

httpServer.listen(PORT, () => logger.info(`Backend running on http://localhost:${PORT}`));
