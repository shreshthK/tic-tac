import type { ServerWebSocket } from 'bun';
import type {
  Board,
  Player,
  MoveMessage,
  GameUpdateMessage,
  GameEndMessage,
  ErrorMessage,
  OpponentDisconnectedMessage,
} from '@tic-tac/shared';
import { checkWinner, isBoardFull, isValidMove, getNextPlayer } from '@tic-tac/shared';
import { makeMove, endGame, getGame } from '../db/games';
import { updateStats, getStats, getGameHistory } from '../db/users';
import { getActiveGame, removeGame, type ActiveGame } from './matchmaking';

export async function handleMove(
  ws: ServerWebSocket<{ userId: string }>,
  message: MoveMessage
): Promise<void> {
  const userId = ws.data.userId;
  const { position } = message.payload;

  // Find the game this user is in
  let activeGame: ActiveGame | undefined;
  for (const [, game] of (await import('./matchmaking')).activeGames) {
    if (game.playerX.userId === userId || game.playerO.userId === userId) {
      activeGame = game;
      break;
    }
  }

  if (!activeGame) {
    sendError(ws, 'You are not in a game');
    return;
  }

  // Get current game state from database
  const game = await getGame(activeGame.id);
  if (!game || game.status !== 'playing') {
    sendError(ws, 'Game is not active');
    return;
  }

  const board: Board = JSON.parse(game.board);
  const currentTurn = game.currentTurn as Player;

  // Determine player's symbol
  const playerSymbol: Player = game.playerXId === userId ? 'X' : 'O';

  // Validate it's this player's turn
  if (currentTurn !== playerSymbol) {
    sendError(ws, "It's not your turn");
    return;
  }

  // Validate move
  if (!isValidMove(board, position)) {
    sendError(ws, 'Invalid move');
    return;
  }

  // Make the move
  const newBoard = [...board] as Board;
  newBoard[position] = playerSymbol;
  const nextTurn = getNextPlayer(playerSymbol);

  await makeMove(activeGame.id, userId, position, playerSymbol, newBoard, nextTurn);

  // Check for winner or draw
  const winner = checkWinner(newBoard);
  const isDraw = !winner && isBoardFull(newBoard);

  if (winner || isDraw) {
    // Game is over
    const winnerId = winner
      ? winner === 'X'
        ? game.playerXId
        : game.playerOId
      : null;

    await endGame(activeGame.id, winnerId);

    // Update stats for both players
    if (winner) {
      const loserId = winner === 'X' ? game.playerOId : game.playerXId;
      await updateStats(winnerId!, 'win');
      await updateStats(loserId!, 'loss');
    } else {
      await updateStats(game.playerXId, 'draw');
      await updateStats(game.playerOId!, 'draw');
    }

    // Send game end messages
    const playerXResult = winner === 'X' ? 'win' : winner === 'O' ? 'lose' : 'draw';
    const playerOResult = winner === 'O' ? 'win' : winner === 'X' ? 'lose' : 'draw';

    const playerXEndMessage: GameEndMessage = {
      type: 'game_end',
      payload: { winner, result: playerXResult },
    };

    const playerOEndMessage: GameEndMessage = {
      type: 'game_end',
      payload: { winner, result: playerOResult },
    };

    // Also send the final board update
    const updateMessage: GameUpdateMessage = {
      type: 'game_update',
      payload: { board: newBoard, currentTurn: nextTurn },
    };

    activeGame.playerX.ws.send(JSON.stringify(updateMessage));
    activeGame.playerO.ws.send(JSON.stringify(updateMessage));
    activeGame.playerX.ws.send(JSON.stringify(playerXEndMessage));
    activeGame.playerO.ws.send(JSON.stringify(playerOEndMessage));

    // Send updated stats and history
    await sendStatsAndHistory(activeGame.playerX.ws, game.playerXId);
    await sendStatsAndHistory(activeGame.playerO.ws, game.playerOId!);

    // Clean up
    removeGame(activeGame.id);
  } else {
    // Game continues - send update to both players
    const updateMessage: GameUpdateMessage = {
      type: 'game_update',
      payload: { board: newBoard, currentTurn: nextTurn },
    };

    activeGame.playerX.ws.send(JSON.stringify(updateMessage));
    activeGame.playerO.ws.send(JSON.stringify(updateMessage));
  }
}

export async function handleDisconnect(userId: string): Promise<void> {
  // Find the game this user was in
  let activeGame: ActiveGame | undefined;
  for (const [, game] of (await import('./matchmaking')).activeGames) {
    if (game.playerX.userId === userId || game.playerO.userId === userId) {
      activeGame = game;
      break;
    }
  }

  if (!activeGame) return;

  const game = await getGame(activeGame.id);
  if (!game || game.status !== 'playing') {
    removeGame(activeGame.id);
    return;
  }

  // The disconnected player loses
  const disconnectedIsX = game.playerXId === userId;
  const winnerId = disconnectedIsX ? game.playerOId : game.playerXId;
  const loserWs = disconnectedIsX ? activeGame.playerX.ws : activeGame.playerO.ws;
  const winnerWs = disconnectedIsX ? activeGame.playerO.ws : activeGame.playerX.ws;
  const winnerSymbol: Player = disconnectedIsX ? 'O' : 'X';

  await endGame(activeGame.id, winnerId);
  await updateStats(winnerId!, 'win');
  await updateStats(userId, 'loss');

  // Notify winner
  const disconnectMessage: OpponentDisconnectedMessage = {
    type: 'opponent_disconnected',
  };

  const endMessage: GameEndMessage = {
    type: 'game_end',
    payload: { winner: winnerSymbol, result: 'win' },
  };

  try {
    winnerWs.send(JSON.stringify(disconnectMessage));
    winnerWs.send(JSON.stringify(endMessage));
    await sendStatsAndHistory(winnerWs, winnerId!);
  } catch {
    // Winner might also be disconnected
  }

  removeGame(activeGame.id);
}

async function sendStatsAndHistory(
  ws: ServerWebSocket<{ userId: string }>,
  userId: string
): Promise<void> {
  const stats = await getStats(userId);
  const history = await getGameHistory(userId);

  if (stats) {
    ws.send(JSON.stringify({ type: 'stats_update', payload: stats }));
  }
  ws.send(JSON.stringify({ type: 'history_update', payload: history }));
}

function sendError(ws: ServerWebSocket<{ userId: string }>, message: string): void {
  const errorMessage: ErrorMessage = {
    type: 'error',
    payload: { message },
  };
  ws.send(JSON.stringify(errorMessage));
}
