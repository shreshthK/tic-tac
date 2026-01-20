export function WaitingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-10">
      {/* Animated Arena Ring */}
      <div className="relative">
        {/* Outer pulse rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-40 h-40 rounded-full border border-neon-cyan/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute w-48 h-48 rounded-full border border-plasma-pink/10 animate-ping" style={{ animationDuration: '3s' }} />
        </div>

        {/* Main spinner container */}
        <div className="relative w-32 h-32">
          {/* Rotating outer ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: 'var(--neon-cyan)',
              borderRightColor: 'var(--plasma-pink)',
              animation: 'spin 2s linear infinite',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(255, 0, 170, 0.2)',
            }}
          />

          {/* Counter-rotating inner ring */}
          <div
            className="absolute inset-3 rounded-full border-2 border-transparent"
            style={{
              borderBottomColor: 'var(--electric-purple)',
              borderLeftColor: 'var(--neon-cyan)',
              animation: 'spin 1.5s linear infinite reverse',
            }}
          />

          {/* Center glow */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-neon-cyan/20 to-plasma-pink/20 animate-pulse" />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-display text-2xl font-black">
              <span className="text-neon-cyan">X</span>
              <span className="text-plasma-pink">O</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-4">
        <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-wider">
          <span className="text-neon-cyan text-glow-cyan">Searching</span>
          <span className="text-white/40 mx-2">for</span>
          <span className="text-plasma-pink text-glow-pink">Opponent</span>
        </h2>

        <p className="font-body text-lg text-white/40">
          Entering the neon arena...
        </p>
      </div>

      {/* Loading dots */}
      <div className="flex items-center gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: i % 2 === 0 ? 'var(--neon-cyan)' : 'var(--plasma-pink)',
              boxShadow: i % 2 === 0
                ? '0 0 10px var(--neon-cyan)'
                : '0 0 10px var(--plasma-pink)',
              animation: 'bounce 1s ease-in-out infinite',
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>

      {/* Bottom status */}
      <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-void-900/50 border border-white/5">
        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
        <span className="font-mono text-xs uppercase tracking-wider text-white/40">
          Matchmaking Active
        </span>
      </div>
    </div>
  );
}
