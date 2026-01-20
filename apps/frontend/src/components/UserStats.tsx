import { useGame } from '../hooks/useGame';

export function UserStats() {
  const { stats } = useGame();

  if (!stats) {
    return (
      <div className="p-4 bg-dark-800 rounded-lg">
        <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
          Your Stats
        </h3>
        <p className="text-dark-500 text-sm">Loading...</p>
      </div>
    );
  }

  const total = stats.wins + stats.losses + stats.draws;
  const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;

  return (
    <div className="p-4 bg-dark-800 rounded-lg">
      <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
        Your Stats
      </h3>

      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <div className="bg-dark-700 rounded p-2">
          <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
          <div className="text-xs text-dark-400">Wins</div>
        </div>
        <div className="bg-dark-700 rounded p-2">
          <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
          <div className="text-xs text-dark-400">Losses</div>
        </div>
        <div className="bg-dark-700 rounded p-2">
          <div className="text-2xl font-bold text-yellow-400">{stats.draws}</div>
          <div className="text-xs text-dark-400">Draws</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-dark-400">Win Rate</span>
        <span className="font-medium">{winRate}%</span>
      </div>

      <div className="mt-2 h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${winRate}%` }}
        />
      </div>
    </div>
  );
}
