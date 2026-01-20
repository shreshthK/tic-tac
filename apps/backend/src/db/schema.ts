import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  ipAddress: text('ip_address').notNull().unique(),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  playerXId: text('player_x_id').notNull().references(() => users.id),
  playerOId: text('player_o_id').references(() => users.id),
  board: text('board').notNull().default('[null,null,null,null,null,null,null,null,null]'),
  currentTurn: text('current_turn').notNull().default('X'),
  status: text('status').notNull().default('waiting'),
  winnerId: text('winner_id').references(() => users.id),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const moves = sqliteTable('moves', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id),
  playerId: text('player_id').notNull().references(() => users.id),
  position: integer('position').notNull(),
  symbol: text('symbol').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type Move = typeof moves.$inferSelect;
export type NewMove = typeof moves.$inferInsert;
