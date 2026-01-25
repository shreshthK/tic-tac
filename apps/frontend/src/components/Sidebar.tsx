import { UserStats } from './UserStats';
import { GameHistory } from './GameHistory';

export function Sidebar() {
  return (
    <aside className="w-80 lg:w-96 h-screen flex flex-col border-r border-neon-cyan/10 bg-void-950/80 backdrop-blur-sm overflow-hidden">
      {/* Header with Logo */}
      <div className="relative px-6 py-8 border-b border-neon-cyan/10">
        {/* Background glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-neon-cyan/5 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="relative flex flex-col items-center gap-2">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full" />
            <div className="relative w-12 h-12 flex items-center justify-center rounded-lg border border-neon-cyan/30 bg-void-900">
              <span className="font-display text-xl font-black text-neon-cyan">X</span>
              <span className="font-display text-xl font-black text-plasma-pink">O</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl font-black tracking-wider">
            <span className="text-neon-cyan">NEON</span>
            <span className="text-white/80 mx-1">|</span>
            <span className="text-plasma-pink">TTT0</span>
          </h1>

          {/* Subtitle */}
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
            Multiplayer Arena
          </p>
        </div>

        {/* Decorative line */}
        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        <UserStats />
        <GameHistory />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5">
        <div className="flex items-center justify-center gap-2 text-white/20">
          <div className="w-1 h-1 rounded-full bg-neon-cyan/50 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-wider">
            System Online
          </span>
          <div className="w-1 h-1 rounded-full bg-neon-cyan/50 animate-pulse" />
        </div>
      </div>
    </aside>
  );
}
