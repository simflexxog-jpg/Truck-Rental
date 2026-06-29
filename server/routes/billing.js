const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
function loadData() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return { tenders: [], transactions: [], chats: [] }; } }
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }

// POST /api/billing/create
router.post('/create', (req, res) => {
  const { tenderId, operator, amount, status } = req.body;
  const data = loadData();
  const txn = {
    id: 'TXN-' + String(Math.floor(Math.random() * 100000)).padStart(5,'0') + '-' + Math.random().toString(36).substring(2,5).toUpperCase(),
    tenderId,
    operator,
    amount,
    status: status || 'escrow',
    createdAt: new Date()
  };
  data.transactions.push(txn);
  saveData(data);
  res.json(txn);
});

// GET /api/billing
router.get('/', (req, res) => {
  const data = loadData();
  res.json(data.transactions);
});

module.exports = router;
