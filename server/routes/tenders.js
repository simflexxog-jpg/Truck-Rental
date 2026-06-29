const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
function loadData() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return { tenders: [], transactions: [], chats: [] }; } }
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }

// GET /api/tenders
router.get('/', (req, res) => {
  const data = loadData();
  res.json(data.tenders);
});

// GET /api/tenders/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const data = loadData();
  const tender = data.tenders.find(t => t.id === id);
  if (!tender) return res.status(404).json({ error: 'Tender not found' });
  res.json(tender);
});

// POST /api/tenders - create tender
router.post('/', (req, res) => {
  const { title, weight, duration, origin, destination } = req.body;
  const data = loadData();
  const tender = {
    id: 'tender_' + Date.now(),
    title,
    customerId: 'customer_' + Date.now(),
    weight,
    duration,
    origin,
    destination,
    auctionEnd: new Date(Date.now() + (duration || 0) * 60000).toISOString(),
    budget: (weight || 0) * 50,
    createdAt: new Date(),
    status: 'open',
    bids: []
  };
  data.tenders.push(tender);
  saveData(data);
  res.json(tender);
});

// POST /api/tenders/:id/bids
router.post('/:id/bids', (req, res) => {
  const { id } = req.params;
  const { partnerId, partnerName, bidAmount } = req.body;
  const data = loadData();
  const tender = data.tenders.find(t => t.id === id);
  if (!tender) return res.status(404).json({ error: 'Tender not found' });

  const bid = { id: 'bid_' + Date.now(), tenderId: id, partnerId, partnerName, bidAmount, createdAt: new Date() };
  tender.bids.push(bid);

  // update leading bid (simple)
  tender.lowestBid = tender.bids.reduce((min, b) => Math.min(min, b.bidAmount), tender.budget || Infinity);
  tender.leadingPartner = tender.bids.reduce((best, b) => (b.bidAmount < (best.bidAmount||Infinity) ? b : best), {}).partnerName || 'Awaiting Bids';

  saveData(data);
  res.json(bid);
});

// POST /api/tenders/:id/accept
router.post('/:id/accept', (req, res) => {
  const { id } = req.params;
  const { bidId } = req.body;
  const data = loadData();
  const tender = data.tenders.find(t => t.id === id);
  if (!tender) return res.status(404).json({ error: 'Tender not found' });
  const bid = tender.bids.find(b => b.id === bidId);
  if (!bid) return res.status(404).json({ error: 'Bid not found' });

  tender.status = 'assigned';
  tender.assignedBidId = bid.id;
  tender.assignedPartnerId = bid.partnerId;
  tender.assignedPartnerName = bid.partnerName;

  saveData(data);
  res.json({ tender, acceptedBid: bid });
});

// POST /api/tenders/:id/reject
router.post('/:id/reject', (req, res) => {
  const { id } = req.params;
  const { bidId } = req.body;
  const data = loadData();
  const tender = data.tenders.find(t => t.id === id);
  if (!tender) return res.status(404).json({ error: 'Tender not found' });
  const idx = tender.bids.findIndex(b => b.id === bidId);
  if (idx < 0) return res.status(404).json({ error: 'Bid not found' });
  tender.bids.splice(idx,1);
  saveData(data);
  res.json({ tender });
});

module.exports = router;
