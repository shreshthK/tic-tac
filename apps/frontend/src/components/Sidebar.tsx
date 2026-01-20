import { UserStats } from './UserStats';
import { GameHistory } from './GameHistory';

export function Sidebar() {
  return (
    <aside className="w-80 bg-dark-850 border-r border-dark-700 p-4 flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🎮</span>
        <h1 className="text-xl font-bold">Tic-Tac-Toe</h1>
      </div>

      <UserStats />
      <GameHistory />
    </aside>
  );
}
