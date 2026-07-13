# Truck Rental

Truck Rental is a full-stack logistics and freight marketplace web application designed for a modern transport workflow. It allows customers to publish freight opportunities, partners to bid for jobs, operators to manage assignments, and finance teams to track billing and ratings. The application is currently configured for deployment on Render using an Angular SSR build.

## 1. Project Overview

This project combines:
- a modern Angular 21 frontend with server-side rendering,
- a Node.js/Express API for tenders, chat, and billing,
- optional MongoDB-backed auction and order flows,
- Socket.IO-based real-time updates for live bidding and order activity.

The app is structured around two primary user roles:
- Customer: create tenders, review bids, accept a partner, and follow the delivery workflow.
- Partner: browse active tenders, submit bids, and track assigned jobs.

## 2. Core Features

### Customer experience
- Create and manage freight tenders
- Review bids from transport partners
- Accept or reject bids
- Monitor assigned jobs and billing state
- Access dashboards for operational oversight

### Partner experience
- View active tenders and auction opportunities
- Place competitive bids
- Receive assignment updates
- Participate in chat-driven coordination

### Platform capabilities
- Authentication and role-based routing
- Billing and transaction management
- Rating and feedback flow
- Live map and route-related modules
- AI-assisted chat interface
- SSR-ready Angular frontend for production hosting

## 3. Technology Stack

### Frontend
- Angular 21
- TypeScript
- Angular SSR
- RxJS
- Leaflet and Turf for mapping features
- Socket.IO client

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB (optional, for auction/order models)
- JSON file persistence for lightweight development use

### Deployment
- Render
- Node.js runtime
- Angular production build with SSR start command

## 4. Architecture Summary

The application uses a modular architecture:
- The Angular frontend lives in the src directory and handles UI, routing, services, and components.
- The Express backend lives in the server directory and serves REST endpoints for tenders, chat, and billing.
- The server also exposes MongoDB-backed auction and order routes when a MongoDB connection is available.
- Socket.IO provides real-time event broadcasting for bids, chat, and order updates.

### High-level flow
1. A customer creates a tender or auction request.
2. Partners view the request and place bids.
3. The customer accepts a bid.
4. The system updates the order lifecycle, billing state, and chat context.
5. The frontend displays the latest state through Angular services and SSR-rendered pages.

## 5. Project Structure

```text
src/
  app/
    auth/              # login and registration screens
    billing/           # billing, payment, rating, transaction views
    customer/          # customer dashboards and freight workflows
    partner/           # partner dashboards and tender workflows
    core/              # shared UI shell, header, sidebar, chatbox
    guards/            # route protection for customer/partner roles
    services/          # API and state-management services
    shared/            # reusable shared components and helpers

server/
  index.js            # main Express server entry point
  routes/             # tenders, chat, billing, auctions, orders
  models/             # Mongoose models for Mongo-backed data
  data.json           # simple file-based persistence for dev/testing

render.yaml          # Render deployment configuration
package.json         # Angular app scripts and dependencies
server/package.json  # backend dependencies and scripts
```

## 6. Local Development Setup

### Prerequisites
- Node.js 20+ recommended
- npm 10+
- Optional: MongoDB running locally or a MongoDB Atlas URI

### 1) Install dependencies

Install the Angular app dependencies:

```bash
npm install
```

If you want to use the backend locally as well:

```bash
cd server
npm install
```

### 2) Start the frontend

```bash
npm start
```

This runs the Angular development server and typically serves the app at:

```text
http://localhost:4200/
```

### 3) Start the backend

In a second terminal:

```bash
cd server
npm run dev
```

The backend will usually run at:

```text
http://localhost:3000/
```

### 4) Health check

The backend exposes a simple health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "ok": true }
```

## 7. Available Scripts

From the project root:

```bash
npm start           # start Angular dev server
npm run build       # build production artifacts
npm run watch       # build in watch mode for development
npm test            # run unit tests
npm run serve:ssr:Truck-Rental
                    # start the SSR server from built output
```

From the server folder:

```bash
cd server
npm run dev         # run backend with nodemon
npm start           # run backend directly
```

## 8. Backend API Reference

The backend currently supports the following routes.

### Health
- GET /health

### Tender endpoints
- GET /api/tenders
- GET /api/tenders/:id
- POST /api/tenders
- POST /api/tenders/:id/bids
- POST /api/tenders/:id/accept
- POST /api/tenders/:id/reject

### Chat endpoints
- POST /api/chat/send
- GET /api/chat/:tenderId

### Billing endpoints
- POST /api/billing/create
- GET /api/billing

### Auction and order endpoints
- POST /api/auctions
- GET /api/auctions/open
- POST /api/auctions/:id/bids
- POST /api/auctions/:id/accept
- GET /api/orders
- GET /api/orders/:id

### Example request

Create a tender:

```bash
curl -X POST http://localhost:3000/api/tenders \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Urgent Freight Delivery",
    "weight": 12,
    "duration": 45,
    "origin": "Kolkata",
    "destination": "Durgapur"
  }'
```

## 9. Data Storage Behavior

The project supports two storage modes:

### Development mode
- Tender, chat, and billing data are stored in server/data.json.
- This is useful for quick demos and local testing.

### MongoDB mode
- Auction and order flows are wired to MongoDB through Mongoose models.
- If a MongoDB URI is provided, the backend will attempt to connect to it.
- If MongoDB is unavailable, the server logs a warning and continues in a fallback mode.

## 10. Environment Variables

The backend and deployment flow support the following environment variables:

- PORT: Port for the backend server. Defaults to 3000.
- NODE_ENV: Set to production on Render.
- MONGO_URI: MongoDB connection string for the Mongo-backed routes.

Example:

```bash
export PORT=3000
export NODE_ENV=production
export MONGO_URI=mongodb://127.0.0.1:27017/truck_rental
```

## 11. Render Deployment

The repository includes a Render configuration file at render.yaml.

### Current Render setup
The Render service is configured to:
- build the Angular app with npm install and npm run build,
- start the SSR server using npm run serve:ssr:Truck-Rental,
- run in production mode with NODE_ENV=production.

### Deployment steps
1. Sign in to Render and create a new Web Service.
2. Connect this repository.
3. Render should detect render.yaml automatically.
4. Confirm the build and start commands.
5. Deploy the service.

### Important notes for production
- The frontend services currently use a hard-coded backend URL of http://localhost:3000/api. For a real production deployment, update these values to use an environment-based API base URL or your deployed backend domain.
- If you want the Express backend to run as a separate Render service, create a second web service for the server folder and configure its own build/start commands.

For a more detailed Render-specific walkthrough, see [docs/RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md).

## 12. Production Considerations

The current codebase is a solid prototype and demo platform, but production hardening is still recommended:
- Replace localStorage-based authentication with a secure backend auth system.
- Move all API URLs to environment configuration.
- Add proper authorization and role enforcement on the backend.
- Use a managed database and persistent storage for all business data.
- Add monitoring, logging, and backup strategies.
- Introduce rate limiting, input validation, and secure CORS policies.

## 13. Troubleshooting

### Frontend does not load
- Confirm that the Angular dev server is running.
- Check whether the browser is opening on the expected port.

### Backend returns errors
- Ensure the server is running on port 3000 or the configured PORT.
- Check CORS and network settings if the frontend cannot reach the backend.

### MongoDB connection issues
- Verify the MONGO_URI value.
- The app can still start in fallback mode, but some routes may behave differently.

### Render build fails
- Confirm that Node and npm versions are compatible.
- Review build logs for dependency or SSR-related errors.

## 14. Summary

Truck Rental is a feature-rich freight marketplace application that demonstrates a modern Angular frontend, a Node.js backend, and deployment readiness on Render. It is suitable for demos, internal tooling, and further extension into a production-grade logistics platform.
