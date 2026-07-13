const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
function loadData() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return { tenders: [], transactions: [], chats: [] }; } }
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }

function buildSiteAwarePrompt(text) {
  return `You are LogiAI, the smart assistant for Renta Truck Rental. Help users with tender auctions, bid strategy, partner matching, delivery routing, billing, and account questions. Keep answers concise, practical, and specific to this platform. User question: ${text}`;
}

function generateLocalReply(text) {
  const input = (text || '').toLowerCase();
  if (input.includes('bid') || input.includes('tender')) {
    return 'To place a bid, open a tender, review the lowest current offer, and submit a lower amount than the current lowest bid. Keep it below the tender budget.';
  }
  if (input.includes('route') || input.includes('detour')) {
    return 'For route or detour help, compare the origin-destination distance, expected delay, and fuel cost. The best option is usually the route with the lowest effective cost.';
  }
  if (input.includes('payment') || input.includes('billing')) {
    return 'Billing is based on the accepted partner bid amount. Once a partner is accepted, the payment screen reflects that winning amount for settlement.';
  }
  if (input.includes('partner')) {
    return 'You can match a partner by checking availability, current bid competitiveness, and service rating before accepting an offer.';
  }
  return 'I can help with tenders, partner bids, routing, billing, and account questions on Renta Truck Rental.';
}

async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY || process.env.groq;
  if (!apiKey) {
    return null;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are LogiAI, a helpful logistics assistant for Renta Truck Rental.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 220
    })
  });

  if (!response.ok) {
    throw new Error(`Groq returned ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

// POST /api/chat/send
router.post('/send', async (req, res) => {
  const { sender, senderRole, text, tenderId } = req.body;
  const data = loadData();
  const msg = { id: 'msg_' + Date.now(), sender, senderRole, text, tenderId, timestamp: new Date() };
  data.chats.push(msg);
  saveData(data);

  try {
    const aiReply = await callGroq(buildSiteAwarePrompt(text));
    if (aiReply) {
      return res.json({ reply: aiReply });
    }
  } catch (err) {
    console.error('Groq chat error:', err.message);
  }

  return res.json({ reply: generateLocalReply(text) });
});

// GET /api/chat/:tenderId
router.get('/:tenderId', (req, res) => {
  const { tenderId } = req.params;
  const data = loadData();
  const msgs = data.chats.filter(m => m.tenderId === tenderId);
  res.json(msgs);
});

module.exports = router;
