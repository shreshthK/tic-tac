import { eq, desc, or } from 'drizzle-orm';
import { db } from './index';
import { users, games, type User } from './schema';
import type { UserStats, GameHistoryItem, Player } from '@tic-tac/shared';

export async function getOrCreateByIp(ipAddress: string): Promise<User> {
  const existing = await db.select().from(users).where(eq(users.ipAddress, ipAddress)).get();

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(users).values({
    id,
    ipAddress,
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    ipAddress,
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: now,
    updatedAt: now,
  };
}

// Creates a new user for each session (allows same IP to play against itself in dev)
export async function getOrCreateBySession(sessionId: string, ipAddress: string): Promise<User> {
  const id = sessionId;
  const now = new Date().toISOString();

  await db.insert(users).values({
    id,
    ipAddress: `${ipAddress}-${sessionId}`, // Make unique per session
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    ipAddress: `${ipAddress}-${sessionId}`,
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateStats(
  userId: string,
  result: 'win' | 'loss' | 'draw'
): Promise<void> {
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return;

  const updates: Partial<User> = {
    updatedAt: new Date().toISOString(),
  };

  if (result === 'win') {
    updates.wins = user.wins + 1;
  } else if (result === 'loss') {
    updates.losses = user.losses + 1;
  } else {
    updates.draws = user.draws + 1;
  }

  await db.update(users).set(updates).where(eq(users.id, userId));
}

export async function getStats(userId: string): Promise<UserStats | null> {
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return null;

  return {
    id: user.id,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws,
  };
}

export async function getGameHistory(userId: string): Promise<GameHistoryItem[]> {
  const userGames = await db
    .select()
    .from(games)
    .where(
      or(
        eq(games.playerXId, userId),
        eq(games.playerOId, userId)
      )
    )
    .orderBy(desc(games.createdAt))
    .limit(20);

  return userGames
    .filter((game) => game.status === 'finished')
    .map((game) => {
      const isPlayerX = game.playerXId === userId;
      const playerSymbol: Player = isPlayerX ? 'X' : 'O';
      const opponentId = isPlayerX ? game.playerOId! : game.playerXId;

      let result: 'win' | 'loss' | 'draw';
      if (!game.winnerId) {
        result = 'draw';
      } else if (game.winnerId === userId) {
        result = 'win';
      } else {
        result = 'loss';
      }

      return {
        id: game.id,
        opponentId,
        result,
        playerSymbol,
        createdAt: game.createdAt,
      };
    });
}
