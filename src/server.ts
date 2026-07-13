import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { WebSocketServer } from 'ws';

const require = createRequire(import.meta.url);

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

try {
  const tendersRouter = require(resolve(process.cwd(), 'server', 'routes', 'tenders'));
  const chatRouter = require(resolve(process.cwd(), 'server', 'routes', 'chat'));
  const billingRouter = require(resolve(process.cwd(), 'server', 'routes', 'billing'));

  app.use('/api/tenders', tendersRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/billing', billingRouter);
} catch (error) {
  console.warn('[API] Could not mount backend routes:', error);
}

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
const port = Number(process.env['PORT'] || 4000);
const host = process.env['HOST'] || '0.0.0.0';
const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (socket) => {
  console.log('[WebSocket] client connected');

  socket.on('message', (raw: string | Buffer) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message && message.type) {
        const payload = JSON.stringify(message);
        wss.clients.forEach((client) => {
          if ((client as any).readyState === (client as any).OPEN) {
            (client as any).send(payload);
          }
        });
      }
    } catch (err) {
      console.warn('[WebSocket] invalid message received', err);
    }
  });

  socket.on('close', () => {
    console.log('[WebSocket] client disconnected');
  });
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  server.listen(port, host, (error?: Error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://${host}:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
