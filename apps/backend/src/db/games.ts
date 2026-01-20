import { eq } from 'drizzle-orm';
import { db } from './index';
import { games, moves, type Game } from './schema';
import type { Board, Player } from '@tic-tac/shared';

export async function createGame(playerXId: string): Promise<Game> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(games).values({
    id,
    playerXId,
    playerOId: null,
    board: JSON.stringify([null, null, null, null, null, null, null, null, null]),
    currentTurn: 'X',
    status: 'waiting',
    winnerId: null,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    playerXId,
    playerOId: null,
    board: JSON.stringify([null, null, null, null, null, null, null, null, null]),
    currentTurn: 'X',
    status: 'waiting',
    winnerId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function joinGame(gameId: string, playerOId: string): Promise<Game | null> {
  const game = await db.select().from(games).where(eq(games.id, gameId)).get();
  if (!game || game.status !== 'waiting') return null;

  const now = new Date().toISOString();
  await db
    .update(games)
    .set({
      playerOId,
      status: 'playing',
      updatedAt: now,
    })
    .where(eq(games.id, gameId));

  return {
    ...game,
    playerOId,
    status: 'playing',
    updatedAt: now,
  };
}

export async function getGame(gameId: string): Promise<Game | null> {
  return db.select().from(games).where(eq(games.id, gameId)).get() || null;
}

export async function makeMove(
  gameId: string,
  playerId: string,
  position: number,
  symbol: Player,
  newBoard: Board,
  nextTurn: Player
): Promise<Game | null> {
  const game = await db.select().from(games).where(eq(games.id, gameId)).get();
  if (!game || game.status !== 'playing') return null;

  const now = new Date().toISOString();
  const moveId = crypto.randomUUID();

  await db.insert(moves).values({
    id: moveId,
    gameId,
    playerId,
    position,
    symbol,
    createdAt: now,
  });

  await db
    .update(games)
    .set({
      board: JSON.stringify(newBoard),
      currentTurn: nextTurn,
      updatedAt: now,
    })
    .where(eq(games.id, gameId));

  return {
    ...game,
    board: JSON.stringify(newBoard),
    currentTurn: nextTurn,
    updatedAt: now,
  };
}

export async function endGame(
  gameId: string,
  winnerId: string | null
): Promise<Game | null> {
  const game = await db.select().from(games).where(eq(games.id, gameId)).get();
  if (!game) return null;

  const now = new Date().toISOString();
  await db
    .update(games)
    .set({
      status: 'finished',
      winnerId,
      updatedAt: now,
    })
    .where(eq(games.id, gameId));

  return {
    ...game,
    status: 'finished',
    winnerId,
    updatedAt: now,
  };
}
