import { useGame } from '../hooks/useGame';

export function UserStats() {
  const { stats } = useGame();

  if (!stats) {
    return (
      <div className="panel-neon p-5">
        <h3 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan/60 mb-4">
          Combat Stats
        </h3>
        <div className="flex items-center justify-center h-24">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-cyan/50 animate-pulse" />
            <span className="font-mono text-sm text-white/30">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const total = stats.wins + stats.losses + stats.draws;
  const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;

  return (
    <div className="panel-neon p-5">
      {/* Header */}
      <h3 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan/60 mb-5">
        Combat Stats
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Wins */}
        <div className="stat-card stat-card-win">
          <div className="font-display text-3xl font-black text-neon-cyan text-glow-cyan">
            {stats.wins}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/40 mt-1">
            Wins
          </div>
        </div>

        {/* Losses */}
        <div className="stat-card stat-card-loss">
          <div className="font-display text-3xl font-black text-plasma-pink text-glow-pink">
            {stats.losses}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/40 mt-1">
            Losses
          </div>
        </div>

        {/* Draws */}
        <div className="stat-card stat-card-draw">
          <div className="font-display text-3xl font-black text-electric-purple">
            {stats.draws}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/40 mt-1">
            Draws
          </div>
        </div>
      </div>

      {/* Win Rate */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-white/40">
            Win Rate
          </span>
          <span className="font-display text-lg font-bold text-neon-cyan">
            {winRate}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-void-800 rounded-full overflow-hidden">
          {/* Background grid pattern */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="h-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 4px, rgba(0,240,255,0.3) 4px, rgba(0,240,255,0.3) 5px)',
              }}
            />
          </div>

          {/* Progress fill */}
          <div
            className="relative h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${winRate}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-cyan-dim rounded-full" />
            <div className="absolute inset-0 bg-neon-cyan/50 blur-sm rounded-full" />
          </div>
        </div>

        {/* Total games */}
        <div className="text-center pt-2">
          <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider">
            {total} Total Battles
          </span>
        </div>
      </div>
    </div>
  );
}
