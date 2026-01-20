import { useGame } from '../hooks/useGame';

export function GameHistory() {
  const { history } = useGame();

  if (history.length === 0) {
    return (
      <div className="panel-neon p-5">
        <h3 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan/60 mb-4">
          Battle Log
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center mb-3">
            <span className="text-2xl opacity-30">?</span>
          </div>
          <p className="font-mono text-sm text-white/30">No battles yet</p>
          <p className="font-mono text-[10px] text-white/20 mt-1">
            Enter the arena to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-neon p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan/60">
          Battle Log
        </h3>
        <span className="font-mono text-[10px] text-white/30">
          {history.length} {history.length === 1 ? 'battle' : 'battles'}
        </span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {history.map((game, index) => (
          <div
            key={game.id}
            className={`
              group relative flex items-center justify-between p-3 rounded
              bg-void-900/50 border border-white/5
              hover:border-neon-cyan/20 hover:bg-void-800/50
              transition-all duration-200
              animate-slide-up
            `}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Left side: Symbol + Opponent */}
            <div className="flex items-center gap-3">
              {/* Player symbol badge */}
              <div
                className={`
                  relative w-8 h-8 flex items-center justify-center rounded
                  font-display text-sm font-black
                  border transition-all duration-200
                  ${game.playerSymbol === 'X'
                    ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan group-hover:border-neon-cyan/50'
                    : 'bg-plasma-pink/10 border-plasma-pink/30 text-plasma-pink group-hover:border-plasma-pink/50'
                  }
                `}
              >
                {game.playerSymbol}
              </div>

              {/* Opponent info */}
              <div className="flex flex-col">
                <span className="font-mono text-xs text-white/60 group-hover:text-white/80 transition-colors">
                  vs {game.opponentId.slice(0, 8)}
                </span>
                <span className="font-mono text-[10px] text-white/20">
                  {new Date(game.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Result badge */}
            <div
              className={`
                relative px-3 py-1 rounded font-display text-[10px] font-bold uppercase tracking-wider
                border transition-all duration-200
                ${game.result === 'win'
                  ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan group-hover:border-neon-cyan/50 group-hover:shadow-neon-cyan-sm'
                  : ''
                }
                ${game.result === 'loss'
                  ? 'bg-plasma-pink/10 border-plasma-pink/30 text-plasma-pink group-hover:border-plasma-pink/50 group-hover:shadow-neon-pink-sm'
                  : ''
                }
                ${game.result === 'draw'
                  ? 'bg-electric-purple/10 border-electric-purple/30 text-electric-purple group-hover:border-electric-purple/50'
                  : ''
                }
              `}
            >
              {game.result}
            </div>

            {/* Hover indicator line */}
            <div
              className={`
                absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 rounded-full
                group-hover:h-1/2 transition-all duration-200
                ${game.result === 'win' ? 'bg-neon-cyan' : ''}
                ${game.result === 'loss' ? 'bg-plasma-pink' : ''}
                ${game.result === 'draw' ? 'bg-electric-purple' : ''}
              `}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
