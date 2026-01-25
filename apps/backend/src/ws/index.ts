import type { ServerWebSocket } from 'bun';
import type { WSMessage, MoveMessage } from '@tic-tac/shared';
import {
  addToQueue,
  removeFromQueue,
  tryMatchmaking,
  type PlayerConnection,
} from './matchmaking';
import { handleMove, handleDisconnect } from './game';
import { getOrCreateByIp } from '../db/users';
import { getStats, getGameHistory } from '../db/users';

export interface WebSocketData {
  userId: string;
}

export async function handleOpen(
  ws: ServerWebSocket<WebSocketData>,
  ip: string
): Promise<void> {
  // Link user to IP address (same IP = same user with persistent stats)
  const user = await getOrCreateByIp(ip);
  ws.data.userId = user.id;

  console.log(`User connected: ${user.id}`);

  // Send current stats and history
  const stats = await getStats(user.id);
  const history = await getGameHistory(user.id);

  if (stats) {
    ws.send(JSON.stringify({ type: 'stats_update', payload: stats }));
  }
  ws.send(JSON.stringify({ type: 'history_update', payload: history }));

  // Add to matchmaking queue
  const connection: PlayerConnection = { ws, userId: user.id };
  addToQueue(connection);

  // Try to match players
  await tryMatchmaking();
}

export async function handleMessage(
  ws: ServerWebSocket<WebSocketData>,
  message: string
): Promise<void> {
  try {
    const parsed: WSMessage = JSON.parse(message);

    switch (parsed.type) {
      case 'move':
        await handleMove(ws, parsed as MoveMessage);
        break;

      case 'connect':
        // Re-queue for matchmaking
        const connection: PlayerConnection = { ws, userId: ws.data.userId };
        addToQueue(connection);
        await tryMatchmaking();
        break;

      default:
        console.log('Unknown message type:', parsed.type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
}

export async function handleClose(ws: ServerWebSocket<WebSocketData>): Promise<void> {
  const userId = ws.data.userId;
  console.log(`User disconnected: ${userId}`);

  // Remove from queue if waiting
  removeFromQueue(userId);

  // Handle game disconnect (opponent wins)
  await handleDisconnect(userId);
}
