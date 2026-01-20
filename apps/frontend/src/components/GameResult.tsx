import { useGame } from '../hooks/useGame';

interface GameResultProps {
  onPlayAgain: () => void;
}

export function GameResult({ onPlayAgain }: GameResultProps) {
  const { result, winner, playerSymbol, opponentDisconnected } = useGame();

  if (!result) return null;

  const isWin = result === 'win';
  const isDraw = result === 'draw';
  const isLoss = result === 'lose';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void-950/90 backdrop-blur-sm" />

      {/* Victory/Defeat glow effects */}
      {isWin && (
        <>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-victory-gold/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-neon-cyan/10 rounded-full blur-2xl animate-pulse" />
        </>
      )}
      {isLoss && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-plasma-pink/10 rounded-full blur-3xl" />
      )}
      {isDraw && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-electric-purple/10 rounded-full blur-3xl" />
      )}

      {/* Modal Content */}
      <div className="relative max-w-md w-full mx-4 animate-slide-up">
        {/* Border glow */}
        <div
          className={`
            absolute -inset-px rounded-xl blur-sm
            ${isWin ? 'bg-gradient-to-br from-victory-gold via-neon-cyan to-victory-gold' : ''}
            ${isLoss ? 'bg-gradient-to-br from-plasma-pink via-plasma-pink-dim to-plasma-pink' : ''}
            ${isDraw ? 'bg-gradient-to-br from-electric-purple via-electric-purple-dim to-electric-purple' : ''}
          `}
        />

        {/* Card */}
        <div className="relative bg-void-950 rounded-xl p-8 border border-white/10">
          {/* Decorative corners */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-neon-cyan/50" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-plasma-pink/50" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-plasma-pink/50" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-neon-cyan/50" />

          {/* Disconnect notice */}
          {opponentDisconnected && (
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-plasma-pink animate-pulse" />
              <span className="font-mono text-xs text-white/50">
                Opponent disconnected
              </span>
            </div>
          )}

          {/* Result Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`
                relative w-24 h-24 flex items-center justify-center rounded-full
                ${isWin ? 'animate-victory-pulse' : ''}
              `}
            >
              {/* Glow background */}
              <div
                className={`
                  absolute inset-0 rounded-full blur-xl opacity-50
                  ${isWin ? 'bg-victory-gold' : ''}
                  ${isLoss ? 'bg-plasma-pink' : ''}
                  ${isDraw ? 'bg-electric-purple' : ''}
                `}
              />

              {/* Icon container */}
              <div
                className={`
                  relative w-20 h-20 flex items-center justify-center rounded-full
                  border-2
                  ${isWin ? 'border-victory-gold bg-victory-gold/10' : ''}
                  ${isLoss ? 'border-plasma-pink bg-plasma-pink/10' : ''}
                  ${isDraw ? 'border-electric-purple bg-electric-purple/10' : ''}
                `}
              >
                <span className="text-5xl">
                  {isWin ? '⚡' : isDraw ? '⚖️' : '💀'}
                </span>
              </div>
            </div>
          </div>

          {/* Result Title */}
          <h2
            className={`
              font-display text-4xl sm:text-5xl font-black text-center uppercase tracking-wider mb-3
              ${isWin ? 'text-victory-gold text-glow-gold' : ''}
              ${isLoss ? 'text-plasma-pink text-glow-pink' : ''}
              ${isDraw ? 'text-electric-purple' : ''}
            `}
          >
            {isWin ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat'}
          </h2>

          {/* Subtitle */}
          <p className="text-center font-body text-lg text-white/50 mb-8">
            {isWin && 'You dominated the arena!'}
            {isDraw && 'A worthy opponent!'}
            {isLoss && 'The arena awaits your return...'}
          </p>

          {/* Winner indicator */}
          {winner && (
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3 px-4 py-2 rounded bg-void-800/50 border border-white/5">
                <span className="font-mono text-xs text-white/40 uppercase">
                  Winner
                </span>
                <span
                  className={`
                    font-display text-xl font-black
                    ${winner === 'X' ? 'text-neon-cyan text-glow-cyan' : 'text-plasma-pink text-glow-pink'}
                  `}
                >
                  {winner}
                </span>
              </div>
            </div>
          )}

          {/* Play Again Button */}
          <button
            onClick={onPlayAgain}
            className={`
              w-full py-4 rounded font-display font-bold text-lg uppercase tracking-wider
              transition-all duration-300 ease-out
              border-2
              ${isWin
                ? 'border-victory-gold text-victory-gold hover:bg-victory-gold/10 hover:shadow-neon-gold'
                : isLoss
                  ? 'border-plasma-pink text-plasma-pink hover:bg-plasma-pink/10 hover:shadow-neon-pink'
                  : 'border-electric-purple text-electric-purple hover:bg-electric-purple/10 hover:shadow-neon-purple'
              }
              hover:scale-[1.02] active:scale-100
            `}
          >
            {isWin ? 'Dominate Again' : isLoss ? 'Revenge Match' : 'Rematch'}
          </button>

          {/* Bottom decoration */}
          <div className="mt-6 flex items-center justify-center">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/20" />
            <span className="px-4 font-mono text-[10px] text-white/20 uppercase tracking-wider">
              Neon Arena
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
