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
    <div className="flex flex-col items-center gap-8">
      {/* Turn Indicator */}
      <div className="text-center">
        {status === 'playing' && (
          <div className="relative">
            {/* Animated background glow */}
            <div
              className={`
                absolute -inset-4 rounded-full blur-2xl opacity-30 transition-all duration-500
                ${isMyTurn ? 'bg-neon-cyan animate-pulse-slow' : 'bg-plasma-pink/50'}
              `}
            />

            <div
              className={`
                relative font-display text-2xl sm:text-3xl font-bold uppercase tracking-[0.2em]
                transition-all duration-300
                ${isMyTurn ? 'text-neon-cyan text-glow-cyan' : 'text-white/40'}
              `}
            >
              {isMyTurn ? (
                <span className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse shadow-neon-cyan" />
                  Your Turn
                  <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse shadow-neon-cyan" />
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-plasma-pink/50" />
                  Opponent's Turn
                  <span className="w-2 h-2 rounded-full bg-plasma-pink/50" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Grid */}
      <div className="relative">
        {/* Outer glow frame */}
        <div className="absolute -inset-4 rounded-lg bg-gradient-to-br from-neon-cyan/10 via-transparent to-plasma-pink/10 blur-xl" />

        {/* Grid container */}
        <div className="relative p-1 rounded-lg bg-gradient-to-br from-neon-cyan/20 via-void-400 to-plasma-pink/20">
          <div className="relative bg-void-950 rounded p-2">
            {/* Corner brackets */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-neon-cyan/60" />
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-plasma-pink/60" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-plasma-pink/60" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-neon-cyan/60" />

            {/* The grid */}
            <div className="grid grid-cols-3 gap-1 relative">
              {/* Grid lines glow effect */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Vertical lines */}
                <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-neon-cyan/40 via-electric-purple/40 to-plasma-pink/40" />
                <div className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-plasma-pink/40 via-electric-purple/40 to-neon-cyan/40" />
                {/* Horizontal lines */}
                <div className="absolute top-1/3 left-0 h-px w-full bg-gradient-to-r from-neon-cyan/40 via-electric-purple/40 to-plasma-pink/40" />
                <div className="absolute top-2/3 left-0 h-px w-full bg-gradient-to-r from-plasma-pink/40 via-electric-purple/40 to-neon-cyan/40" />
              </div>

              {board.map((cell, index) => (
                <Cell
                  key={index}
                  value={cell}
                  onClick={() => onMove(index)}
                  disabled={!canMove || cell !== null}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Player Symbol Badge */}
      <div className="flex items-center gap-4">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />

        <div className="flex items-center gap-3 px-6 py-3 rounded bg-void-800/50 border border-white/5">
          <span className="font-body text-sm uppercase tracking-wider text-white/40">
            Playing as
          </span>
          <span
            className={`
              font-display text-2xl font-black
              ${playerSymbol === 'X' ? 'text-neon-cyan text-glow-cyan' : 'text-plasma-pink text-glow-pink'}
            `}
          >
            {playerSymbol}
          </span>
        </div>

        <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
      </div>
    </div>
  );
}
