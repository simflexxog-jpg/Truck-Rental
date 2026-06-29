const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
function loadData() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return { tenders: [], transactions: [], chats: [] }; } }
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }

// POST /api/chat/send
router.post('/send', (req, res) => {
  const { sender, senderRole, text, tenderId } = req.body;
  const data = loadData();
  const msg = { id: 'msg_' + Date.now(), sender, senderRole, text, tenderId, timestamp: new Date() };
  data.chats.push(msg);
  saveData(data);
  res.json(msg);
});

// GET /api/chat/:tenderId
router.get('/:tenderId', (req, res) => {
  const { tenderId } = req.params;
  const data = loadData();
  const msgs = data.chats.filter(m => m.tenderId === tenderId);
  res.json(msgs);
});

module.exports = router;
