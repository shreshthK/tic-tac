import { Sidebar } from './components/Sidebar';
import { GameBoard } from './components/GameBoard';
import { WaitingScreen } from './components/WaitingScreen';
import { GameResult } from './components/GameResult';
import { useWebSocket } from './hooks/useWebSocket';
import { useGame } from './hooks/useGame';

function App() {
  const { sendMove, findNewGame } = useWebSocket();
  const { status, isConnected } = useGame();

  return (
    <div className="flex h-screen bg-void-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Game Area */}
      <main className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Cyber grid */}
          <div className="absolute inset-0 cyber-grid opacity-50" />

          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-radial-glow" />

          {/* Corner vignette */}
          <div className="absolute inset-0 bg-gradient-to-br from-void-950 via-transparent to-void-950 opacity-60" />

          {/* Ambient glow spots */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-plasma-pink/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {!isConnected ? (
            <ConnectingScreen />
          ) : status === 'waiting' ? (
            <WaitingScreen />
          ) : status === 'playing' || status === 'finished' ? (
            <>
              <GameBoard onMove={sendMove} />
              {status === 'finished' && <GameResult onPlayAgain={findNewGame} />}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function ConnectingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Spinner */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-void-600 border-t-neon-cyan animate-spin" />
        <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent border-b-plasma-pink/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>

      {/* Text */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white/60">
          Initializing
        </h2>
        <p className="font-mono text-sm text-white/30">
          Connecting to arena server...
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-neon-cyan/50 animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/20">
          Establishing connection
        </span>
      </div>
    </div>
  );
}

export default App;
