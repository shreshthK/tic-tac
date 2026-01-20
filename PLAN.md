# Tic-Tac-Toe Multiplayer Web App

## Application Overview

A simple real-time multiplayer tic-tac-toe web application where users can play against each other without authentication. Players are tracked by IP address.

### Core Features

1. **No Authentication** - Users tracked by IP address
2. **IP-Based User Profiles** - New IP = new user object with game history
3. **Real-time Matchmaking** - WebSocket-based waiting room (pairs players 1-2, 3-4, etc.)
4. **Auto-Win on Disconnect** - If opponent disconnects, remaining player wins and returns to waiting
5. **Game Persistence** - Each game stored with move matrix, player references, and status
6. **Dark Mode UI** - Single page with colorful accents, inbox-style game history sidebar

---

## Tech Stack

Create a production-ready monorepo with:

- **Backend**: Hono framework running on Bun (HTTP + WebSocket server)
- **Database**: SQLite via Bun's native `bun:sqlite`
- **ORM**: Drizzle ORM (lightweight, type-safe, great SQLite support)
- **Frontend**: Vite + React
- **Orchestration**: Turborepo for task management and caching
- **Package Management**: pnpm workspaces (better for monorepos)

---

## Database Schema (SQLite + Drizzle)

### Users Table
```typescript
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ipAddress: text("ip_address").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
});
```

### Games Table
```typescript
export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerXId: integer("player_x_id").notNull().references(() => users.id),
  playerOId: integer("player_o_id").references(() => users.id), // null while waiting
  board: text("board").notNull().default("_________"),  // 9 chars: X, O, or _
  currentTurn: text("current_turn", { enum: ["X", "O"] }).notNull().default("X"),
  status: text("status", { enum: ["waiting", "playing", "finished"] }).notNull().default("waiting"),
  winner: text("winner", { enum: ["X", "O", "draw"] }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
});
```

### Moves Table (Optional - for game history replay)
```typescript
export const moves = sqliteTable("moves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id").notNull().references(() => games.id),
  player: text("player", { enum: ["X", "O"] }).notNull(),
  position: integer("position").notNull(), // 0-8
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
```

---

## Application Flow

### 1. User Joins
1. Frontend connects to backend WebSocket
2. Backend extracts IP from connection
3. Backend checks if user exists in Convex by IP
4. If not, create new user record
5. Return user data to frontend

### 2. Matchmaking
1. Check for games with status "waiting"
2. If found: Join as playerO, update status to "playing", notify both players
3. If not found: Create new game as playerX with status "waiting"
4. User sees waiting screen until matched

### 3. Gameplay
1. WebSocket messages for moves: `{ type: "move", position: 0-8 }`
2. Backend validates move (correct turn, valid position)
3. Update game board and moves array in Convex
4. Check for win/draw condition
5. Broadcast updated state to both players

### 4. Game End
1. On win/draw/disconnect: Update game status to "finished"
2. Update winner field
3. Update both users' stats (wins/losses/draws)
4. Both players return to matchmaking queue

### 5. Disconnect Handling
1. If player disconnects during "playing" status
2. Remaining player automatically wins
3. Game marked as finished with winner
4. Remaining player returns to waiting screen

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│                      TIC-TAC-TOE                            │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                          │
│  GAME HISTORY    │         MAIN AREA                        │
│  ────────────    │                                          │
│                  │    [Waiting for opponent...]             │
│  ▶ Game #5 - W   │              OR                          │
│    Game #4 - L   │    ┌───┬───┬───┐                         │
│    Game #3 - W   │    │ X │   │ O │                         │
│    Game #2 - D   │    ├───┼───┼───┤                         │
│    Game #1 - L   │    │   │ X │   │                         │
│                  │    ├───┼───┼───┤                         │
│  ────────────    │    │ O │   │   │                         │
│  Stats:          │    └───┴───┴───┘                         │
│  Wins: 12        │                                          │
│  Losses: 8       │    Your turn! (X)                        │
│  Draws: 3        │                                          │
│                  │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

- **Dark mode** background with colorful accents (neon/vibrant colors for X and O)
- **Left sidebar**: Mail inbox-style game history list with win/loss/draw indicators
- **Main area**: Waiting message OR game board with turn indicator
- **Single page**: No routing needed, state-driven UI

---

## Folder Structure

```
tic-tac/
├── apps/
│   ├── backend/              # Hono API + WebSocket server (Bun)
│   │   ├── src/
│   │   │   ├── index.ts      # Server entry (HTTP + WebSocket)
│   │   │   ├── db/
│   │   │   │   ├── schema.ts # Drizzle schema definitions
│   │   │   │   ├── index.ts  # Database connection
│   │   │   │   └── migrate.ts# Migration script
│   │   │   ├── routes/       # HTTP API routes
│   │   │   ├── ws/           # WebSocket handlers
│   │   │   │   ├── index.ts  # WebSocket server setup
│   │   │   │   ├── matchmaking.ts
│   │   │   │   └── game.ts   # Game logic handlers
│   │   │   └── lib/          # Utilities
│   │   ├── data/             # SQLite database file location
│   │   ├── drizzle.config.ts # Drizzle configuration
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/             # Vite + React app
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── components/
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── packages/
│   └── shared/               # Shared types and utilities
│       ├── src/
│       │   ├── types.ts      # Shared TypeScript types
│       │   └── utils.ts      # Shared utilities (win detection)
│       ├── package.json
│       └── tsconfig.json
├── package.json              # Root package.json with workspaces
├── pnpm-workspace.yaml       # pnpm workspace configuration
├── tsconfig.base.json        # Base TypeScript config
├── turbo.json                # Turborepo configuration
├── .gitignore
└── README.md
```

## Implementation Steps

### 1. Root Configuration Files

- **package.json**: Set up pnpm workspaces, root scripts, and dev dependencies (turbo, typescript, eslint, prettier, vitest, husky)
- **pnpm-workspace.yaml**: Define workspace packages
- **tsconfig.base.json**: Base TypeScript configuration with path aliases for `@shared/*`
- **turbo.json**: Configure Turborepo pipelines for dev, build, and test tasks
- **.eslintrc.js**: Shared ESLint configuration
- **.prettierrc**: Prettier configuration
- **.gitignore**: Ignore node_modules, build outputs, Convex generated files, env files
- **.husky/**: Git hooks configuration (pre-commit with lint-staged)

### 2. Shared Package (`packages/shared`)

- Create shared TypeScript types (API contracts, DTOs)
- Shared Zod validation schemas
- Shared utilities and helpers
- Package.json with proper exports (include zod)
- TypeScript config extending base

**Shared Types:**
```typescript
// Game types
type Player = "X" | "O";
type CellValue = Player | null;
type Board = CellValue[];  // 9-cell array
type GameStatus = "waiting" | "playing" | "finished";
type GameResult = Player | "draw";

// WebSocket message types
type WSMessage =
  | { type: "move"; position: number }
  | { type: "waiting" }
  | { type: "game_start"; game: GameState }
  | { type: "game_update"; game: GameState }
  | { type: "game_end"; winner: GameResult }
  | { type: "user_data"; user: UserData }
  | { type: "error"; message: string };
```

**Shared Utilities:**
```typescript
// Win detection - check all winning combinations
const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],  // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8],  // Columns
  [0, 4, 8], [2, 4, 6]              // Diagonals
];

function checkWinner(board: Board): GameResult | null;
function isBoardFull(board: Board): boolean;
function isValidMove(board: Board, position: number): boolean;
```

### 3. Backend App (`apps/backend`)

- Initialize Hono server with Bun adapter
- **WebSocket Server Setup** (Bun native WebSocket support)
  - Connection handler: Extract IP, find/create user
  - Message handler: Process moves, validate game state
  - Close handler: Handle disconnects, auto-win logic
- **Matchmaking Logic**
  - Queue management for waiting players
  - Pair players and create/update games
- Configure Zod validator middleware (`@hono/zod-validator`)
- Add CORS middleware (`@hono/cors`)
- Add logger middleware (`@hono/logger`)
- Configure Convex client integration
- Environment variables for Convex URL
- Error handling middleware
- TypeScript config extending base with Node types

**WebSocket Message Types:**
```typescript
// Client -> Server
{ type: "move", position: number }  // 0-8

// Server -> Client
{ type: "waiting" }                           // Waiting for opponent
{ type: "game_start", game: GameState }       // Game matched
{ type: "game_update", game: GameState }      // After each move
{ type: "game_end", winner: "X"|"O"|"draw" }  // Game finished
{ type: "user_data", user: UserData }         // Initial user data
{ type: "error", message: string }            // Error message
```

### 4. Database Setup (`apps/backend/src/db/`)

- Define Drizzle schema (users, games, moves tables)
- Configure `bun:sqlite` connection
- Set up Drizzle ORM instance
- Create migration script for initial schema

**Database Service Functions:**
```typescript
// users.ts
getOrCreateByIp(ip: string): User
getUserById(id: number): User | null
updateUserStats(id: number, result: "win" | "loss" | "draw"): void
getGameHistory(userId: number): Game[]

// games.ts
findWaitingGame(): Game | null
createGame(playerXId: number): Game
joinGame(gameId: number, playerOId: number): Game
makeMove(gameId: number, position: number, player: "X" | "O"): Game
endGame(gameId: number, winner: "X" | "O" | "draw"): void
getGameById(id: number): Game | null
```

### 5. Frontend App (`apps/frontend`)

- Initialize Vite + React + TypeScript project
- Configure Tailwind CSS (tailwind.config.js, postcss.config.js)
- **Dark theme configuration** with vibrant accent colors
- **No routing needed** - single page app with state-driven UI
- Configure Vite proxy for backend (HTTP + WebSocket)
- **WebSocket hook** for real-time game updates
- Import shared types from `@shared`
- Set up path aliases in vite.config.ts
- TypeScript config extending base with DOM types

**Components to Create:**
```
src/
├── App.tsx                 # Main app with WebSocket connection
├── components/
│   ├── GameBoard.tsx       # 3x3 tic-tac-toe grid
│   ├── Cell.tsx            # Individual cell component
│   ├── Sidebar.tsx         # Left sidebar container
│   ├── GameHistory.tsx     # Inbox-style game list
│   ├── GameHistoryItem.tsx # Single game entry
│   ├── UserStats.tsx       # Wins/losses/draws display
│   ├── WaitingScreen.tsx   # "Waiting for opponent" UI
│   └── GameResult.tsx      # Win/lose/draw overlay
├── hooks/
│   ├── useWebSocket.ts     # WebSocket connection hook
│   └── useGame.ts          # Game state management
├── types/
│   └── index.ts            # Frontend-specific types
└── styles/
    └── index.css           # Tailwind + custom dark theme
```

**Color Scheme (Dark Mode):**
- Background: `#0f0f0f` (near black)
- Surface: `#1a1a2e` (dark purple-blue)
- X Color: `#ff6b6b` (coral/red)
- O Color: `#4ecdc4` (teal/cyan)
- Accent: `#a855f7` (purple)
- Text: `#ffffff` / `#a0a0a0`

### 6. Development Scripts

- Root `dev` script using Turborepo to run all apps in parallel
- Individual dev scripts for each app
- Build scripts for production builds
- Environment variable management

## Key Features

- **Type Safety**: Shared types between frontend and backend via `@shared` package
- **Hot Reload**: All apps support hot reload during development
- **Real-time Updates**: WebSocket for instant game state synchronization
- **Lightweight Database**: SQLite with Drizzle ORM - no external services needed
- **Path Aliases**: Clean imports using `@shared/*` across packages
- **Turborepo Caching**: Fast builds with intelligent caching

## Files to Create

1. Root: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `turbo.json`, `.gitignore`
2. `packages/shared/`: package.json, tsconfig.json, src/types.ts, src/utils.ts (win detection)
3. `apps/backend/`: package.json, tsconfig.json, drizzle.config.ts, src/index.ts, src/db/, src/ws/, src/routes/
4. `apps/frontend/`: package.json, tsconfig.json, vite.config.ts, tailwind.config.js, postcss.config.js, src/main.tsx, src/App.tsx, src/components/, src/hooks/

## Technology Stack by Layer

### Frontend (`apps/frontend`) - React + Vite

**Core Framework:**

- `react` & `react-dom` - UI framework
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - Vite React plugin

**Styling:**

- `tailwindcss` - Utility-first CSS framework
- `postcss` - CSS processing
- `autoprefixer` - CSS vendor prefixing

**Routing:**

- `react-router-dom` - Client-side routing

**State Management:**

- `zustand` - Lightweight state management for game state
- Native WebSocket for real-time updates from backend

**Form Handling:**

- `react-hook-form` - Performant form library
- `zod` - Schema validation (shared with backend)

**HTTP Client:**

- Native `fetch` API or `axios` - For Hono API calls

**UI Components:**

- (Optional) `@headlessui/react` or `radix-ui` - Headless UI components
- (Optional) `lucide-react` or `react-icons` - Icon library

**Development:**

- `@types/react` & `@types/react-dom` - TypeScript types
- `vite-plugin-eslint` - ESLint integration

### Backend (`apps/backend`) - Hono + Bun

**Core Framework:**

- `hono` - Web framework
- `@hono/node-server` - Node.js adapter (for compatibility)

**Validation:**

- `zod` - Schema validation (shared with frontend)
- `@hono/zod-validator` - Hono Zod middleware

**CORS & Middleware:**

- `@hono/cors` - CORS middleware
- `@hono/logger` - Request logging
- `@hono/compress` - Response compression

**Database:**

- `bun:sqlite` - Bun's native SQLite driver (fast, zero dependencies)
- `drizzle-orm` - Type-safe ORM for SQLite
- `drizzle-kit` - Migration tooling

**Authentication:**

- (Optional) `@hono/jwt` - JWT handling
- (Optional) `@hono/bearer-auth` - Bearer token auth

**Error Handling:**

- Built-in Hono error handling
- Custom error middleware

**Environment:**

- `dotenv` or Bun's built-in env support

**Development:**

- `@types/node` - Node.js types
- `tsx` or Bun's built-in TypeScript support

### Database - SQLite + Drizzle

**Core:**

- `bun:sqlite` - Bun's built-in SQLite driver
- `drizzle-orm` - Type-safe SQL query builder and ORM

**Schema:**

- Drizzle schema definitions with full TypeScript support
- Automatic type inference for queries and inserts

**Migrations:**

- `drizzle-kit` - Schema migrations and introspection
- `drizzle-kit generate` - Generate migration SQL files
- `drizzle-kit push` - Push schema changes directly (dev mode)

### Shared Package (`packages/shared`)

**Validation:**

- `zod` - Shared validation schemas

**Types:**

- TypeScript interfaces and types
- API contract types
- DTOs (Data Transfer Objects)

**Utilities:**

- Shared helper functions
- Constants
- Type guards

### Development Tools (Root)

**Monorepo Management:**

- `turbo` - Build system and task runner
- `pnpm` - Package manager

**TypeScript:**

- `typescript` - TypeScript compiler
- Shared `tsconfig.base.json`

**Code Quality:**

- `eslint` - Linting
- `prettier` - Code formatting
- `@typescript-eslint/eslint-plugin` & `@typescript-eslint/parser` - TypeScript ESLint

**Testing:**

- `vitest` - Fast unit test framework (works with Vite)
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers

**Git Hooks:**

- `husky` - Git hooks
- `lint-staged` - Run linters on staged files

## Dependencies Summary

### Root Dependencies

```json
{
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "vitest": "^1.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"
  }
}
```

### Frontend Dependencies (`apps/frontend`)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

### Backend Dependencies (`apps/backend`)

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "drizzle-orm": "^0.29.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "@types/bun": "latest"
  }
}
```

### Shared Package Dependencies (`packages/shared`)

```json
{
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

## Implementation Order

### Phase 1: Monorepo Setup
1. Create root config files (package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json)
2. Set up shared package with types and utilities
3. Run `pnpm install` at root
4. Verify Turborepo works: `pnpm dev`

### Phase 2: Database & Backend
1. Set up Drizzle schema (users, games, moves tables)
2. Configure `bun:sqlite` database connection
3. Create database service functions (CRUD operations)
4. Set up Hono HTTP server with basic routes
5. Set up Bun WebSocket server
6. Implement matchmaking logic (waiting queue, pairing)
7. Implement game logic (moves, win detection, end game)
8. Implement disconnect handling (auto-forfeit)

### Phase 3: Frontend
1. Set up Vite + React with dark theme Tailwind config
2. Build WebSocket connection hook (`useWebSocket`)
3. Build game state hook (`useGame`)
4. Create game board component (3x3 grid)
5. Create sidebar with game history list
6. Create waiting screen with animation
7. Create game result overlay (win/lose/draw)
8. Wire up all real-time state updates

### Phase 4: Testing & Polish
1. Test multiplayer flow (2 browser windows)
2. Test disconnect handling (close tab mid-game)
3. Test reconnection scenarios
4. Polish UI animations/transitions
5. Test edge cases (rapid moves, simultaneous actions)

## Why pnpm for Monorepos?

- **Disk Efficiency**: Uses hard links, saves significant disk space
- **Strict Dependency Resolution**: Prevents phantom dependencies
- **Better Workspace Support**: More mature workspace tooling
- **Turborepo Integration**: Works seamlessly with Turborepo
- **Faster Installs**: Efficient caching and parallel installs
