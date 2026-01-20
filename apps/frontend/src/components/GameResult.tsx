import { useGame } from '../hooks/useGame';

interface GameResultProps {
  onPlayAgain: () => void;
}

export function GameResult({ onPlayAgain }: GameResultProps) {
  const { result, winner, playerSymbol, opponentDisconnected } = useGame();

  if (!result) return null;

  const isWin = result === 'win';
  const isDraw = result === 'draw';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-xl p-8 text-center max-w-sm mx-4 shadow-2xl">
        {opponentDisconnected && (
          <p className="text-dark-400 text-sm mb-4">Opponent disconnected</p>
        )}

        <div
          className={`
            text-6xl mb-4
            ${isWin ? 'animate-bounce' : ''}
          `}
        >
          {isWin ? '🎉' : isDraw ? '🤝' : '😔'}
        </div>

        <h2
          className={`
            text-3xl font-bold mb-2
            ${isWin ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-red-400'}
          `}
        >
          {isWin ? 'You Won!' : isDraw ? "It's a Draw!" : 'You Lost'}
        </h2>

        {winner && (
          <p className="text-dark-400 mb-6">
            {winner === playerSymbol ? 'Congratulations!' : `${winner} wins`}
          </p>
        )}

        {isDraw && (
          <p className="text-dark-400 mb-6">Good game! Try again?</p>
        )}

        <button
          onClick={onPlayAgain}
          className="
            px-6 py-3 bg-blue-600 hover:bg-blue-500
            text-white font-medium rounded-lg
            transition-colors duration-200
            w-full
          "
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
