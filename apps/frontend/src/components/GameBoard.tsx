import { Cell } from './Cell';
import { useGame } from '../hooks/useGame';

interface GameBoardProps {
  onMove: (position: number) => void;
}

export function GameBoard({ onMove }: GameBoardProps) {
  const { board, currentTurn, playerSymbol, status } = useGame();

  const isMyTurn = currentTurn === playerSymbol;
  const canMove = status === 'playing' && isMyTurn;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-lg font-medium mb-2">
        {status === 'playing' && (
          <span className={isMyTurn ? 'text-green-400' : 'text-dark-400'}>
            {isMyTurn ? "Your turn" : "Opponent's turn"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, index) => (
          <Cell
            key={index}
            value={cell}
            onClick={() => onMove(index)}
            disabled={!canMove || cell !== null}
          />
        ))}
      </div>

      <div className="mt-4 text-sm text-dark-400">
        You are <span className={playerSymbol === 'X' ? 'text-blue-400' : 'text-red-400'}>
          {playerSymbol}
        </span>
      </div>
    </div>
  );
}
