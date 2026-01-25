import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleOpen, handleMessage, handleClose, type WebSocketData } from './ws';

const app = new Hono();

app.use('*', cors());

app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Tic-Tac-Toe API' });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy' });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const server = Bun.serve({
  port,
  fetch(req, server) {
    const url = new URL(req.url);

    // Handle WebSocket upgrade
    if (url.pathname === '/ws') {
      const ip = server.requestIP(req)?.address || '127.0.0.1';
      const upgraded = server.upgrade(req, {
        data: { userId: '' } as WebSocketData,
        headers: {
          'X-Real-IP': ip,
        },
      });

      if (upgraded) {
        return undefined;
      }

      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    // Handle HTTP requests with Hono
    return app.fetch(req);
  },
  websocket: {
    async open(ws) {
      const ip = ws.remoteAddress || '127.0.0.1';
      await handleOpen(ws, ip);
    },
    async message(ws, message) {
      await handleMessage(ws, message.toString());
    },
    async close(ws) {
      await handleClose(ws);
    },
  },
});

console.log(`Server running at http://localhost:${server.port}`);
