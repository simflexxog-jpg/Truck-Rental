Minimal Node.js backend for Truck-Rental

Quick start:

1. Install dependencies

```bash
cd server
npm install
```

2. Start server

```bash
npm start
```

API Endpoints:

- GET /api/tenders — list tenders
- POST /api/tenders — create tender { title, weight, duration, origin, destination }
- POST /api/tenders/:id/bids — place bid { partnerId, partnerName, bidAmount }
- POST /api/tenders/:id/accept — accept bid { bidId }
- POST /api/tenders/:id/reject — reject bid { bidId }
- POST /api/chat/send — send chat { sender, senderRole, text, tenderId }
- GET /api/chat/:tenderId — get messages for a tender
- POST /api/billing/create — create transaction { tenderId, operator, amount, status }

Notes:
- Data is stored in `server/data.json` (simple JSON persistence for dev/testing).
- Add CORS rules or security as needed for production.
- To integrate with the Angular frontend, update services to call these endpoints (example: `http://localhost:3000/api/tenders`).
