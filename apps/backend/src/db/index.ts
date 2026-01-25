import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const databasePath = process.env.DATABASE_PATH || './data.db';
const sqlite = new Database(databasePath);

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    ip_address TEXT NOT NULL UNIQUE,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    player_x_id TEXT NOT NULL REFERENCES users(id),
    player_o_id TEXT REFERENCES users(id),
    board TEXT NOT NULL DEFAULT '[null,null,null,null,null,null,null,null,null]',
    current_turn TEXT NOT NULL DEFAULT 'X',
    status TEXT NOT NULL DEFAULT 'waiting',
    winner_id TEXT REFERENCES users(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS moves (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id),
    player_id TEXT NOT NULL REFERENCES users(id),
    position INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
