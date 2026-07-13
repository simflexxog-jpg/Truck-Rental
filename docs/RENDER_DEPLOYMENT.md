# Render Deployment Guide

This document covers how to deploy the Truck Rental project on Render.

## 1. What is deployed

The repository currently includes:
- an Angular SSR frontend served by Node.js,
- a separate Node/Express backend in the server directory.

The current Render configuration in render.yaml targets the Angular SSR application.

## 2. Render service configuration

Use the following values when creating the service:

- Runtime: Node
- Build Command: npm install && npm run build
- Start Command: npm run serve:ssr:Truck-Rental

Environment variables:
- NODE_ENV=production

Optional:
- MONGO_URI=your-mongodb-connection-string

## 3. Recommended deployment flow

1. Push the repository to GitHub.
2. Create a new Web Service in Render.
3. Connect the repository.
4. Let Render read render.yaml.
5. Deploy the service.

## 4. Backend deployment option

If you want the Express backend deployed separately, create a second web service with the server directory as the root.

Suggested values:
- Build Command: cd server && npm install
- Start Command: cd server && npm start

Environment variables:
- PORT=10000 (Render will provide its own port, so use process.env.PORT dynamically)
- NODE_ENV=production
- MONGO_URI=your-mongodb-connection-string

## 5. Production API URL configuration

The frontend currently uses a hard-coded localhost URL for the API. For Render deployment, replace this with a configurable base URL.

Recommended approach:
- add an environment variable such as API_BASE_URL,
- update Angular services to use it,
- ensure the frontend points at the correct Render backend URL.

## 6. Common deployment issues

- Build fails because dependencies are missing: verify package.json and lockfile integrity.
- The app loads but API calls fail: update the frontend API base URL to the deployed backend URL.
- Real-time features fail: ensure Socket.IO is communicating with the correct origin and endpoint.
- MongoDB connection errors: verify the MONGO_URI value and database access rules.

## 7. Suggested next improvements

- Add environment-based API configuration for the Angular app.
- Move authentication to a secure backend flow.
- Deploy the backend as a dedicated service for production.
- Add monitoring and logs for the Render instance.
