# Tic-Tac-Toe Multiplayer - Architecture & Data Flow

## Table of Contents
1. [Project Structure](#project-structure)
2. [Tooling Overview](#tooling-overview)
3. [Build System](#build-system)
4. [Data Flow](#data-flow)
5. [WebSocket Connection Lifecycle](#websocket-connection-lifecycle)
6. [Game Flow](#game-flow)
7. [Database Layer](#database-layer)

---

## Project Structure

```
tic-tac/
├── package.json              # Root package - workspace config
├── pnpm-workspace.yaml       # Defines workspace packages
├── turbo.json                # Turborepo task configuration
├── tsconfig.base.json        # Shared TypeScript config
│
├── packages/
│   └── shared/               # Shared types & utilities
│       ├── src/
│       │   ├── types.ts      # TypeScript interfaces (Board, Player, WSMessage, etc.)
│       │   ├── utils.ts      # Game logic (checkWinner, isValidMove, etc.)
│       │   └── index.ts      # Re-exports everything
│       └── package.json
│
└── apps/
    ├── backend/              # Bun + Hono server
    │   ├── src/
    │   │   ├── index.ts      # Entry point - HTTP & WebSocket server
    │   │   ├── db/           # Database layer
    │   │   │   ├── schema.ts # Drizzle table definitions
    │   │   │   ├── index.ts  # SQLite connection
    │   │   │   ├── users.ts  # User queries
    │   │   │   └── games.ts  # Game queries
    │   │   └── ws/           # WebSocket handlers
    │   │       ├── index.ts  # Connection handling
    │   │       ├── matchmaking.ts  # Player queue & pairing
    │   │       └── game.ts   # Move handling & win detection
    │   └── package.json
    │
    └── frontend/             # React + Vite app
        ├── src/
        │   ├── main.tsx      # React entry point
        │   ├── App.tsx       # Main component
        │   ├── hooks/
        │   │   ├── useWebSocket.ts  # WebSocket connection management
        │   │   └── useGame.ts       # Zustand state store
        │   └── components/
        │       ├── GameBoard.tsx
        │       ├── Cell.tsx
        │       ├── Sidebar.tsx
        │       ├── UserStats.tsx
        │       ├── GameHistory.tsx
        │       ├── WaitingScreen.tsx
        │       └── GameResult.tsx
        ├── vite.config.ts    # Vite + proxy configuration
        └── package.json
```

---

## Tooling Overview

### 1. pnpm (Package Manager)

**What it does:** Manages dependencies across the monorepo.

**Key features:**
- **Workspaces**: Links local packages together (`@tic-tac/shared` is available to both apps)
- **Efficient storage**: Uses hard links, saves disk space
- **Strict**: Prevents phantom dependencies

**Configuration:** `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"      # apps/backend, apps/frontend
  - "packages/*"  # packages/shared
```

**How packages reference each other:**
```json
// apps/backend/package.json
{
  "dependencies": {
    "@tic-tac/shared": "workspace:*"  // Links to local package
  }
}
```

---

### 2. Turborepo (Build Orchestrator)

**What it does:** Runs tasks across all packages intelligently.

**Configuration:** `turbo.json`
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],  // Build dependencies first
      "outputs": ["dist/**"]    // Cache these folders
    },
    "dev": {
      "cache": false,           // Don't cache (long-running)
      "persistent": true        // Keep process alive
    }
  }
}
```

**What happens when you run `pnpm dev`:**

```
┌─────────────────────────────────────────────────────────────┐
│  Turborepo                                                  │
│                                                             │
│  1. Reads turbo.json                                        │
│  2. Discovers all packages                                  │
│  3. Builds dependency graph                                 │
│  4. Runs "dev" script in each package IN PARALLEL           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   shared     │  │   backend    │  │   frontend   │       │
│  │  tsc --watch │  │  bun --watch │  │    vite      │       │
│  │              │  │  port 3000   │  │  port 5173   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. TypeScript (Type Checker)

**What it does:** Provides static type checking across the codebase.

**Configuration hierarchy:**
```
tsconfig.base.json          # Shared settings (target, module, strict)
    ↓ extends
packages/shared/tsconfig.json
apps/backend/tsconfig.json
apps/frontend/tsconfig.json   # Adds JSX, DOM types
```

**Shared package compilation:**
```
packages/shared/src/*.ts  →  tsc  →  packages/shared/dist/*.js + *.d.ts
```

The compiled `.js` files are what other packages actually import at runtime.

---

### 4. Bun (Backend Runtime)

**What it does:** Runs the backend server. Alternative to Node.js.

**Key features used:**
- **Native SQLite**: `bun:sqlite` - no external database needed
- **WebSocket server**: Built-in, high performance
- **Hot reload**: `bun --watch` restarts on file changes

**Entry point:** `apps/backend/src/index.ts`
```typescript
Bun.serve({
  port: 3000,
  fetch(req, server) { ... },      // HTTP requests
  websocket: {
    open(ws) { ... },              // New connection
    message(ws, message) { ... },  // Incoming message
    close(ws) { ... },             // Disconnection
  },
});
```

---

### 5. Hono (HTTP Framework)

**What it does:** Lightweight web framework for handling HTTP routes.

**Used for:**
```typescript
const app = new Hono();
app.use('*', cors());
app.get('/', (c) => c.json({ status: 'ok' }));
app.get('/health', (c) => c.json({ status: 'healthy' }));
```

Note: WebSocket handling is done directly by Bun, not Hono.

---

### 6. Drizzle ORM (Database)

**What it does:** Type-safe database queries for SQLite.

**Schema definition:** `apps/backend/src/db/schema.ts`
```typescript
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  ipAddress: text('ip_address').notNull().unique(),
  wins: integer('wins').notNull().default(0),
  // ...
});
```

**Query example:**
```typescript
// Type-safe! TypeScript knows the return type
const user = await db.select().from(users).where(eq(users.id, oduserId)).get();
```

**How SQLite runs:**
```
Bun Process
    │
    ├── bun:sqlite (native driver)
    │       │
    │       ▼
    └── data.db (file on disk)
```

No separate database server - SQLite runs embedded in the Bun process.

---

### 7. Vite (Frontend Build Tool)

**What it does:** Development server + production bundler for React.

**Dev mode features:**
- Hot Module Replacement (HMR) - instant updates without refresh
- Proxy configuration - forwards requests to backend

**Configuration:** `apps/frontend/vite.config.ts`
```typescript
server: {
  port: 5173,
  proxy: {
    '/ws': {
      target: 'ws://localhost:3000',
      ws: true,  // WebSocket proxy
    },
    '/api': {
      target: 'http://localhost:3000',
    },
  },
}
```

---

### 8. React + Zustand (Frontend)

**React:** UI component library
**Zustand:** Lightweight state management

**State store:** `apps/frontend/src/hooks/useGame.ts`
```typescript
export const useGame = create<GameStore>((set) => ({
  board: createEmptyBoard(),
  status: 'waiting',
  // ...
  updateBoard: (board, currentTurn) => set({ board, currentTurn }),
}));
```

Components subscribe to state:
```typescript
function GameBoard() {
  const { board, status } = useGame();  // Re-renders when these change
}
```

---

### 9. Tailwind CSS (Styling)

**What it does:** Utility-first CSS framework.

**How it works:**
1. You write classes in JSX: `className="bg-dark-800 text-white p-4"`
2. Tailwind scans files for class names
3. Generates only the CSS you actually use

**Configuration:** `apps/frontend/tailwind.config.js`
```javascript
content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],  // Files to scan
theme: {
  extend: {
    colors: {
      dark: { 800: '#343541', 900: '#202123', ... }  // Custom colors
    }
  }
}
```

---

## Build System

### Development Mode (`pnpm dev`)

```
┌────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Browser (localhost:5173)                                          │
│       │                                                             │
│       │  1. User opens page                                         │
│       ▼                                                             │
│   ┌─────────────────────────────────────────┐                       │
│   │         Vite Dev Server (:5173)         │                       │
│   │                                         │                       │
│   │  • Serves React app                     │                       │
│   │  • Hot reloads on file changes          │                       │
│   │  • Proxies /ws and /api to backend      │                       │
│   └─────────────────────────────────────────┘                       │
│       │                                                             │
│       │  2. WebSocket: /ws                                          │
│       │     (proxied)                                               │
│       ▼                                                             │
│   ┌─────────────────────────────────────────┐                       │
│   │         Bun Server (:3000)              │                       │
│   │                                         │                       │
│   │  • Handles WebSocket connections        │                       │
│   │  • Runs game logic                      │                       │
│   │  • Queries SQLite database              │                       │
│   └─────────────────────────────────────────┘                       │
│       │                                                             │
│       ▼                                                             │
│   ┌─────────────────────────────────────────┐                       │
│   │         SQLite (data.db)                │                       │
│   │                                         │                       │
│   │  • users table                          │                       │
│   │  • games table                          │                       │
│   │  • moves table                          │                       │
│   └─────────────────────────────────────────┘                       │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Production Build (`pnpm build`)

```
┌────────────────────────────────────────────────────────────────────┐
│                         BUILD PROCESS                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. shared package                                                 │
│      src/*.ts  ──tsc──►  dist/*.js + dist/*.d.ts                   │
│                                                                     │
│   2. backend (after shared)                                         │
│      src/*.ts  ──bun build──►  dist/index.js                       │
│                                                                     │
│   3. frontend (after shared)                                        │
│      src/*.tsx  ──vite build──►  dist/                             │
│                                    ├── index.html                   │
│                                    ├── assets/                      │
│                                    │   ├── index-[hash].js          │
│                                    │   └── index-[hash].css         │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### State Management Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    Zustand Store (useGame)                    │  │
│   │                                                               │  │
│   │  {                                                            │  │
│   │    isConnected: boolean,                                      │  │
│   │    gameId: string | null,                                     │  │
│   │    board: [null, null, 'X', ...],                            │  │
│   │    currentTurn: 'X' | 'O',                                   │  │
│   │    status: 'waiting' | 'playing' | 'finished',               │  │
│   │    playerSymbol: 'X' | 'O',                                  │  │
│   │    stats: { wins: 0, losses: 0, draws: 0 },                  │  │
│   │    history: [...]                                            │  │
│   │  }                                                            │  │
│   └──────────────────────────────────────────────────────────────┘  │
│        ▲                                           │                 │
│        │ updates state                             │ reads state     │
│        │                                           ▼                 │
│   ┌────────────────┐    ┌─────────────────────────────────────────┐ │
│   │ useWebSocket   │    │              Components                  │ │
│   │                │    │                                          │ │
│   │ • connect()    │    │  App.tsx                                 │ │
│   │ • sendMove()   │    │    ├── Sidebar                           │ │
│   │ • findNewGame()│    │    │     ├── UserStats                   │ │
│   │                │    │    │     └── GameHistory                 │ │
│   └────────────────┘    │    └── GameBoard / WaitingScreen         │ │
│        │                │         └── Cell (x9)                    │ │
│        │                │         └── GameResult (overlay)         │ │
│        │                └─────────────────────────────────────────┘ │
│        │                                                             │
└────────│─────────────────────────────────────────────────────────────┘
         │
         │ WebSocket
         │
┌────────▼─────────────────────────────────────────────────────────────┐
│                           BACKEND                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │                    In-Memory State                           │    │
│   │                                                              │    │
│   │  waitingQueue: PlayerConnection[]     // Players seeking game│    │
│   │  activeGames: Map<gameId, ActiveGame> // Ongoing games       │    │
│   │  userToGame: Map<userId, gameId>      // Quick lookup        │    │
│   └─────────────────────────────────────────────────────────────┘    │
│        │                                                              │
│        │ queries/updates                                              │
│        ▼                                                              │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │                    SQLite Database                           │    │
│   │                                                              │    │
│   │  users: { id visitorid, ipAddress, wins, losses, draws }    │    │
│   │  games: { id, playerXId, playerOId, board, status, winner } │    │
│   │  moves: { id, gameId, playerId, position, symbol }          │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## WebSocket Connection Lifecycle

### 1. Initial Connection

```
Browser                         Vite Proxy                      Bun Server
   │                                │                                │
   │  1. new WebSocket('/ws')       │                                │
   │ ──────────────────────────────►│                                │
   │                                │  2. Forward to ws://localhost:3000/ws
   │                                │ ──────────────────────────────►│
   │                                │                                │
   │                                │                                │ 3. handleOpen()
   │                                │                                │    • Create user in DB
   │                                │                                │    • Add to waitingQueue
   │                                │                                │    • Try matchmaking
   │                                │                                │
   │                                │  4. { type: 'stats_update', payload: {...} }
   │                                │◄────────────────────────────── │
   │◄──────────────────────────────│                                │
   │                                │                                │
   │                                │  5. { type: 'history_update', payload: [...] }
   │                                │◄────────────────────────────── │
   │◄──────────────────────────────│                                │
   │                                │                                │
   │  (If no opponent yet)          │                                │
   │                                │  6. { type: 'waiting' }        │
   │                                │◄────────────────────────────── │
   │◄──────────────────────────────│                                │
```

### 2. Matchmaking (Second Player Joins)

```
                                    Bun Server
                                        │
Player 1 connects ─────────────────────►│
                                        │ waitingQueue = [Player1]
                                        │
Player 2 connects ─────────────────────►│
                                        │ waitingQueue = [Player1, Player2]
                                        │
                                        │ tryMatchmaking():
                                        │   • Pop both from queue
                                        │   • Create game in DB
                                        │   • Store in activeGames
                                        │
                  { type: 'game_start', │
                    payload: {          │
                      gameId: 'xxx',    │
                      playerSymbol: 'X',│
                      opponentId: '...' │
                    }                   │
Player 1 ◄──────────────────────────────│
                                        │
                  { type: 'game_start', │
                    payload: {          │
                      gameId: 'xxx',    │
                      playerSymbol: 'O',│
                      opponentId: '...' │
                    }                   │
Player 2 ◄──────────────────────────────│
```

---

## Game Flow

### Making a Move

```
Player X (Browser)                    Bun Server                    Player O (Browser)
      │                                   │                                │
      │  1. Click cell 4                  │                                │
      │     sendMove(4)                   │                                │
      │                                   │                                │
      │  { type: 'move',                  │                                │
      │    payload: { position: 4 } }     │                                │
      │ ─────────────────────────────────►│                                │
      │                                   │                                │
      │                                   │ 2. handleMove()                │
      │                                   │    • Validate it's X's turn    │
      │                                   │    • Validate cell is empty    │
      │                                   │    • Update board in DB        │
      │                                   │    • Check for winner          │
      │                                   │                                │
      │                                   │ 3. Broadcast to BOTH players   │
      │                                   │                                │
      │  { type: 'game_update',           │                                │
      │    payload: {                     │                                │
      │      board: [..., 'X', ...],      │                                │
      │      currentTurn: 'O'             │                                │
      │    }                              │                                │
      │◄───────────────────────────────── │ ─────────────────────────────►│
      │                                   │                                │
      │  4. updateBoard() in Zustand      │     4. updateBoard() in Zustand│
      │     • UI re-renders               │        • UI re-renders         │
      │     • Shows 'O's turn'            │        • Shows 'Your turn'     │
```

### Game End (Win/Draw)

```
                                    Bun Server
                                        │
Player makes winning move ─────────────►│
                                        │
                                        │ handleMove():
                                        │   • Update board
                                        │   • checkWinner() → 'X'
                                        │   • endGame() in DB
                                        │   • updateStats() for both
                                        │
                                        │ Send to Player X:
{ type: 'game_update', ... } ◄──────────│
{ type: 'game_end',                     │
  payload: {                            │
    winner: 'X',                        │
    result: 'win'                       │
  }                                     │
} ◄─────────────────────────────────────│
{ type: 'stats_update', ... } ◄─────────│
{ type: 'history_update', ... } ◄───────│
                                        │
                                        │ Send to Player O:
                                        │──────────────────────────────►
                                        │  { type: 'game_update', ... }
                                        │  { type: 'game_end',
                                        │    payload: {
                                        │      winner: 'X',
                                        │      result: 'lose'  ← Different!
                                        │    }
                                        │  }
                                        │  { type: 'stats_update', ... }
                                        │  { type: 'history_update', ... }
                                        │
                                        │ Cleanup:
                                        │   • Remove from activeGames
                                        │   • Remove from userToGame
```

### Player Disconnection

```
Player X                              Bun Server                      Player O
   │                                      │                                │
   │  Closes tab / loses connection       │                                │
   │ ─────────────────────X               │                                │
   │                                      │                                │
   │                                      │ handleClose():                 │
   │                                      │   • removeFromQueue()          │
   │                                      │   • handleDisconnect()         │
   │                                      │     • Find active game         │
   │                                      │     • Player O wins by default │
   │                                      │     • Update DB stats          │
   │                                      │                                │
   │                                      │ { type: 'opponent_disconnected' }
   │                                      │ ──────────────────────────────►│
   │                                      │                                │
   │                                      │ { type: 'game_end',            │
   │                                      │   payload: {                   │
   │                                      │     winner: 'O',               │
   │                                      │     result: 'win'              │
   │                                      │   }                            │
   │                                      │ }                              │
   │                                      │ ──────────────────────────────►│
```

---

## Database Layer

### Schema

```sql
-- users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- UUID
  ip_address TEXT NOT NULL UNIQUE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- games table
CREATE TABLE games (
  id TEXT PRIMARY KEY,           -- UUID
  player_x_id TEXT NOT NULL REFERENCES users(id),
  player_o_id TEXT REFERENCES users(id),  -- NULL until player joins
  board TEXT DEFAULT '[null,null,null,null,null,null,null,null,null]',
  current_turn TEXT DEFAULT 'X',
  status TEXT DEFAULT 'waiting', -- 'waiting' | 'playing' | 'finished'
  winner_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- moves table (game history)
CREATE TABLE moves (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  player_id TEXT NOT NULL REFERENCES users(id),
  position INTEGER NOT NULL,     -- 0-8
  symbol TEXT NOT NULL,          -- 'X' | 'O'
  created_at TEXT NOT NULL
);
```

### Query Flow Example

```
User makes a move
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  1. Validate game exists and is playing                      │
│     db.select().from(games).where(eq(games.id, gameId))     │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  2. Insert move record                                       │
│     db.insert(moves).values({ gameId, playerId, position }) │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  3. Update game board                                        │
│     db.update(games).set({ board, currentTurn })            │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  4. If game over: update stats                               │
│     db.update(users).set({ wins: wins + 1 })                │
└──────────────────────────────────────────────────────────────┘
```

---

## Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Package Manager | pnpm | Manages dependencies, links workspaces |
| Build Orchestrator | Turborepo | Runs tasks in parallel, caches builds |
| Backend Runtime | Bun | Fast JS runtime with native SQLite & WebSocket |
| HTTP Framework | Hono | Lightweight HTTP routing |
| Database ORM | Drizzle | Type-safe SQLite queries |
| Database | SQLite | Embedded file-based database |
| Frontend Build | Vite | Dev server with HMR, production bundler |
| UI Library | React | Component-based UI |
| State Management | Zustand | Simple reactive state store |
| Styling | Tailwind CSS | Utility-first CSS |
| Type Safety | TypeScript | Static type checking across all packages |
