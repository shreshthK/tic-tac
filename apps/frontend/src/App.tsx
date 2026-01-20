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
    <div className="flex h-screen bg-dark-900">
      <Sidebar />

      <main className="flex-1 flex items-center justify-center">
        {!isConnected ? (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-dark-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark-400">Connecting to server...</p>
          </div>
        ) : status === 'waiting' ? (
          <WaitingScreen />
        ) : status === 'playing' || status === 'finished' ? (
          <>
            <GameBoard onMove={sendMove} />
            {status === 'finished' && <GameResult onPlayAgain={findNewGame} />}
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
