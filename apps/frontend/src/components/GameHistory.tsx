import { useGame } from '../hooks/useGame';

export function GameHistory() {
  const { history } = useGame();

  if (history.length === 0) {
    return (
      <div className="p-4 bg-dark-800 rounded-lg">
        <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
          Game History
        </h3>
        <p className="text-dark-500 text-sm">No games played yet</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-dark-800 rounded-lg">
      <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
        Game History
      </h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.map((game) => (
          <div
            key={game.id}
            className="flex items-center justify-between p-2 bg-dark-700 rounded hover:bg-dark-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold
                  ${game.playerSymbol === 'X' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}
                `}
              >
                {game.playerSymbol}
              </span>
              <span className="text-sm text-dark-300">
                vs {game.opponentId.slice(0, 8)}...
              </span>
            </div>

            <span
              className={`
                text-xs font-medium px-2 py-1 rounded
                ${game.result === 'win' ? 'bg-green-500/20 text-green-400' : ''}
                ${game.result === 'loss' ? 'bg-red-500/20 text-red-400' : ''}
                ${game.result === 'draw' ? 'bg-yellow-500/20 text-yellow-400' : ''}
              `}
            >
              {game.result.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
