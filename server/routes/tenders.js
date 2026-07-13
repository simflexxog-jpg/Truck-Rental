const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
function loadData() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return { tenders: [], transactions: [], chats: [] }; } }
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }
function isNonEmptyString(value) { return typeof value === 'string' && value.trim().length > 0; }
function isPositiveNumber(value) { return typeof value === 'number' && Number.isFinite(value) && value > 0; }
function getTenderById(data, id) { return data.tenders.find(t => t.id === id); }

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
  if (!isNonEmptyString(title) || !isNonEmptyString(origin) || !isNonEmptyString(destination)) {
    return res.status(400).json({ error: 'Title, origin, and destination are required.' });
  }
  if (!isPositiveNumber(weight) || !isPositiveNumber(duration)) {
    return res.status(400).json({ error: 'Weight and duration must be positive numbers.' });
  }
  if (weight > 50000) {
    return res.status(400).json({ error: 'Weight exceeds the maximum supported value.' });
  }
  if (duration > 1440) {
    return res.status(400).json({ error: 'Duration exceeds the maximum supported value.' });
  }

  const data = loadData();
  const tender = {
    id: 'tender_' + Date.now(),
    title: title.trim(),
    customerId: 'customer_' + Date.now(),
    weight,
    duration,
    origin: origin.trim(),
    destination: destination.trim(),
    auctionEnd: new Date(Date.now() + duration * 60000).toISOString(),
    budget: weight * 50,
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
  const tender = getTenderById(data, id);
  if (!tender) return res.status(404).json({ error: 'Tender not found' });
  if (tender.status !== 'open') return res.status(409).json({ error: 'Bids can only be placed while a tender is open.' });
  if (!isNonEmptyString(partnerId) || !isNonEmptyString(partnerName)) {
    return res.status(400).json({ error: 'Partner identification is required.' });
  }
  if (!isPositiveNumber(bidAmount)) {
    return res.status(400).json({ error: 'Bid amount must be a positive number.' });
  }
  if (bidAmount >= tender.budget) {
    return res.status(400).json({ error: 'Bid must be less than the tender budget.' });
  }
  if (bidAmount <= 0) {
    return res.status(400).json({ error: 'Bid amount must be greater than zero.' });
  }

  const currentLowest = tender.bids.length ? Math.min(...tender.bids.map(b => b.bidAmount)) : null;
  if (currentLowest !== null && bidAmount >= currentLowest) {
    return res.status(400).json({ error: 'Counter bid must be lower than the current lowest bid.' });
  }

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
  const tender = getTenderById(data, id);
  if (!tender) return res.status(404).json({ error: 'Tender not found' });
  if (tender.status !== 'open') return res.status(409).json({ error: 'Only open tenders can be assigned.' });
  if (!isNonEmptyString(bidId)) return res.status(400).json({ error: 'A valid bid id is required.' });
  const bid = tender.bids.find(b => b.id === bidId);
  if (!bid) return res.status(404).json({ error: 'Bid not found' });

  tender.status = 'assigned';
  tender.paymentApproved = false;
  tender.assignedBidId = bid.id;
  tender.assignedPartnerId = bid.partnerId;
  tender.assignedPartnerName = bid.partnerName;
  tender.winningBidAmount = bid.bidAmount;

  saveData(data);
  res.json({ tender, acceptedBid: bid });
});

// POST /api/tenders/:id/reject
router.post('/:id/reject', (req, res) => {
  const { id } = req.params;
  const { bidId } = req.body;
  const data = loadData();
  const tender = getTenderById(data, id);
  if (!tender) return res.status(404).json({ error: 'Tender not found' });
  if (tender.status !== 'open') return res.status(409).json({ error: 'Only open tenders can reject bids.' });
  if (!isNonEmptyString(bidId)) return res.status(400).json({ error: 'A valid bid id is required.' });
  const idx = tender.bids.findIndex(b => b.id === bidId);
  if (idx < 0) return res.status(404).json({ error: 'Bid not found' });
  tender.bids.splice(idx,1);
  saveData(data);
  res.json({ tender });
});

module.exports = router;
