const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, 'data.json');
function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return { tenders: [], transactions: [], chats: [] }; }
}
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }

// Routes
app.use('/api/tenders', require('./routes/tenders'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/billing', require('./routes/billing'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
