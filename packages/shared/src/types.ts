export type Player = 'X' | 'O';

export type CellValue = Player | null;

export type Board = [
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue
];

export type GameStatus = 'waiting' | 'playing' | 'finished';

export type GameResult = 'win' | 'lose' | 'draw' | null;

export interface GameState {
  id: string;
  board: Board;
  currentTurn: Player;
  status: GameStatus;
  winner: Player | null;
  playerSymbol: Player | null;
}

export interface UserStats {
  id: string;
  wins: number;
  losses: number;
  draws: number;
}

export interface GameHistoryItem {
  id: string;
  opponentId: string;
  result: 'win' | 'loss' | 'draw';
  playerSymbol: Player;
  createdAt: string;
}

// WebSocket message types
export type WSMessageType =
  | 'connect'
  | 'waiting'
  | 'game_start'
  | 'move'
  | 'game_update'
  | 'game_end'
  | 'opponent_disconnected'
  | 'error'
  | 'stats_update'
  | 'history_update';

export interface WSMessage {
  type: WSMessageType;
  payload?: unknown;
}

export interface ConnectMessage extends WSMessage {
  type: 'connect';
}

export interface WaitingMessage extends WSMessage {
  type: 'waiting';
}

export interface GameStartMessage extends WSMessage {
  type: 'game_start';
  payload: {
    gameId: string;
    playerSymbol: Player;
    opponentId: string;
  };
}

export interface MoveMessage extends WSMessage {
  type: 'move';
  payload: {
    position: number;
  };
}

export interface GameUpdateMessage extends WSMessage {
  type: 'game_update';
  payload: {
    board: Board;
    currentTurn: Player;
  };
}

export interface GameEndMessage extends WSMessage {
  type: 'game_end';
  payload: {
    winner: Player | null;
    result: GameResult;
  };
}

export interface OpponentDisconnectedMessage extends WSMessage {
  type: 'opponent_disconnected';
}

export interface ErrorMessage extends WSMessage {
  type: 'error';
  payload: {
    message: string;
  };
}

export interface StatsUpdateMessage extends WSMessage {
  type: 'stats_update';
  payload: UserStats;
}

export interface HistoryUpdateMessage extends WSMessage {
  type: 'history_update';
  payload: GameHistoryItem[];
}
