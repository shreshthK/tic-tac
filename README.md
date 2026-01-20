# Tic-Tac-Toe Multiplayer

A real-time multiplayer tic-tac-toe game built with modern web technologies.

## Features

- Real-time multiplayer gameplay via WebSockets
- Automatic matchmaking - connects two players instantly
- Player statistics (wins, losses, draws)
- Game history
- Dark theme UI

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Zustand, Tailwind CSS, Vite |
| Backend | Bun, Hono, WebSockets |
| Database | SQLite (embedded via Drizzle ORM) |
| Monorepo | pnpm workspaces, Turborepo |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Bun](https://bun.sh/) v1.0+
- [pnpm](https://pnpm.io/) v9+ (or enable via `corepack enable`)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd tic-tac

# Install dependencies
pnpm install

# Build shared package
pnpm --filter @tic-tac/shared build
```

### Development

```bash
pnpm dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

Open two browser tabs to http://localhost:5173 to play against yourself.

### Production Build

```bash
pnpm build
```

## Project Structure

```
tic-tac/
├── apps/
│   ├── backend/          # Bun + Hono server
│   └── frontend/         # React + Vite app
├── packages/
│   └── shared/           # Shared types & game logic
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── ARCHITECTURE.md       # Detailed technical documentation
```

## How to Play

1. Open http://localhost:5173 in two browser tabs
2. First player waits for opponent
3. Second player joins, game starts automatically
4. Take turns clicking cells to place X or O
5. First to get 3 in a row wins
6. Stats and history update after each game

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers |
| `pnpm build` | Build all packages for production |
| `pnpm --filter @tic-tac/backend dev` | Run backend only |
| `pnpm --filter @tic-tac/frontend dev` | Run frontend only |

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation on:

- Tooling and what each tool does
- Data flow through the application
- WebSocket connection lifecycle
- Game state management
- Database schema

## License

MIT
