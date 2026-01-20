import type { ServerWebSocket } from 'bun';
import type { Player, GameStartMessage, WaitingMessage } from '@tic-tac/shared';
import { createGame, joinGame } from '../db/games';

export interface PlayerConnection {
  ws: ServerWebSocket<{ userId: string }>;
  userId: string;
}

export interface ActiveGame {
  id: string;
  playerX: PlayerConnection;
  playerO: PlayerConnection;
}

// Waiting queue for matchmaking
const waitingQueue: PlayerConnection[] = [];

// Active games map: gameId -> ActiveGame
export const activeGames = new Map<string, ActiveGame>();

// User to game map: userId -> gameId
export const userToGame = new Map<string, string>();

export function addToQueue(connection: PlayerConnection): void {
  // Remove if already in queue
  removeFromQueue(connection.userId);
  waitingQueue.push(connection);
}

export function removeFromQueue(userId: string): void {
  const index = waitingQueue.findIndex((c) => c.userId === userId);
  if (index !== -1) {
    waitingQueue.splice(index, 1);
  }
}

export function isInQueue(userId: string): boolean {
  return waitingQueue.some((c) => c.userId === userId);
}

export async function tryMatchmaking(): Promise<void> {
  while (waitingQueue.length >= 2) {
    const playerX = waitingQueue.shift()!;
    const playerO = waitingQueue.shift()!;

    // Create game in database
    const game = await createGame(playerX.userId);
    await joinGame(game.id, playerO.userId);

    // Store active game
    const activeGame: ActiveGame = {
      id: game.id,
      playerX,
      playerO,
    };

    activeGames.set(game.id, activeGame);
    userToGame.set(playerX.userId, game.id);
    userToGame.set(playerO.userId, game.id);

    // Notify both players
    const playerXMessage: GameStartMessage = {
      type: 'game_start',
      payload: {
        gameId: game.id,
        playerSymbol: 'X',
        opponentId: playerO.userId,
      },
    };

    const playerOMessage: GameStartMessage = {
      type: 'game_start',
      payload: {
        gameId: game.id,
        playerSymbol: 'O',
        opponentId: playerX.userId,
      },
    };

    playerX.ws.send(JSON.stringify(playerXMessage));
    playerO.ws.send(JSON.stringify(playerOMessage));
  }

  // Notify remaining players they're still waiting
  for (const connection of waitingQueue) {
    const waitingMessage: WaitingMessage = { type: 'waiting' };
    connection.ws.send(JSON.stringify(waitingMessage));
  }
}

export function getActiveGame(gameId: string): ActiveGame | undefined {
  return activeGames.get(gameId);
}

export function getGameByUserId(userId: string): ActiveGame | undefined {
  const gameId = userToGame.get(userId);
  if (!gameId) return undefined;
  return activeGames.get(gameId);
}

export function removeGame(gameId: string): void {
  const game = activeGames.get(gameId);
  if (game) {
    userToGame.delete(game.playerX.userId);
    userToGame.delete(game.playerO.userId);
    activeGames.delete(gameId);
  }
}
