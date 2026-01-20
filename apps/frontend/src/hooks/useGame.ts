import { create } from 'zustand';
import type {
  Board,
  Player,
  GameStatus,
  GameResult,
  UserStats,
  GameHistoryItem,
} from '@tic-tac/shared';
import { createEmptyBoard } from '@tic-tac/shared';

interface GameStore {
  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Game state
  gameId: string | null;
  board: Board;
  currentTurn: Player;
  status: GameStatus;
  playerSymbol: Player | null;
  opponentId: string | null;
  winner: Player | null;
  result: GameResult;
  opponentDisconnected: boolean;

  // User state
  stats: UserStats | null;
  history: GameHistoryItem[];

  // Actions
  setGameStart: (gameId: string, playerSymbol: Player, opponentId: string) => void;
  updateBoard: (board: Board, currentTurn: Player) => void;
  setGameEnd: (winner: Player | null, result: GameResult) => void;
  setOpponentDisconnected: () => void;
  setStats: (stats: UserStats) => void;
  setHistory: (history: GameHistoryItem[]) => void;
  resetGame: () => void;
}

export const useGame = create<GameStore>((set) => ({
  // Connection state
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),

  // Game state
  gameId: null,
  board: createEmptyBoard(),
  currentTurn: 'X',
  status: 'waiting',
  playerSymbol: null,
  opponentId: null,
  winner: null,
  result: null,
  opponentDisconnected: false,

  // User state
  stats: null,
  history: [],

  // Actions
  setGameStart: (gameId, playerSymbol, opponentId) =>
    set({
      gameId,
      playerSymbol,
      opponentId,
      board: createEmptyBoard(),
      currentTurn: 'X',
      status: 'playing',
      winner: null,
      result: null,
      opponentDisconnected: false,
    }),

  updateBoard: (board, currentTurn) =>
    set({
      board,
      currentTurn,
    }),

  setGameEnd: (winner, result) =>
    set({
      winner,
      result,
      status: 'finished',
    }),

  setOpponentDisconnected: () =>
    set({
      opponentDisconnected: true,
    }),

  setStats: (stats) => set({ stats }),

  setHistory: (history) => set({ history }),

  resetGame: () =>
    set({
      gameId: null,
      board: createEmptyBoard(),
      currentTurn: 'X',
      status: 'waiting',
      playerSymbol: null,
      opponentId: null,
      winner: null,
      result: null,
      opponentDisconnected: false,
    }),
}));
