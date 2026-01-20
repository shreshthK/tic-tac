import { useEffect, useRef, useCallback } from 'react';
import type {
  WSMessage,
  GameStartMessage,
  GameUpdateMessage,
  GameEndMessage,
  StatsUpdateMessage,
  HistoryUpdateMessage,
} from '@tic-tac/shared';
import { useGame } from './useGame';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const {
    setConnected,
    setGameStart,
    updateBoard,
    setGameEnd,
    setOpponentDisconnected,
    setStats,
    setHistory,
    resetGame,
  } = useGame();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);

      // Reconnect after 2 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
  }, [setConnected]);

  const handleMessage = useCallback(
    (message: WSMessage) => {
      switch (message.type) {
        case 'waiting':
          // Already in waiting state
          break;

        case 'game_start': {
          const { gameId, playerSymbol, opponentId } = (message as GameStartMessage).payload;
          setGameStart(gameId, playerSymbol, opponentId);
          break;
        }

        case 'game_update': {
          const { board, currentTurn } = (message as GameUpdateMessage).payload;
          updateBoard(board, currentTurn);
          break;
        }

        case 'game_end': {
          const { winner, result } = (message as GameEndMessage).payload;
          setGameEnd(winner, result);
          break;
        }

        case 'opponent_disconnected':
          setOpponentDisconnected();
          break;

        case 'stats_update': {
          const stats = (message as StatsUpdateMessage).payload;
          setStats(stats);
          break;
        }

        case 'history_update': {
          const history = (message as HistoryUpdateMessage).payload;
          setHistory(history);
          break;
        }

        case 'error':
          console.error('Server error:', message.payload);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    },
    [setGameStart, updateBoard, setGameEnd, setOpponentDisconnected, setStats, setHistory]
  );

  const sendMove = useCallback((position: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'move',
          payload: { position },
        })
      );
    }
  }, []);

  const findNewGame = useCallback(() => {
    resetGame();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'connect' }));
    }
  }, [resetGame]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { sendMove, findNewGame };
}
