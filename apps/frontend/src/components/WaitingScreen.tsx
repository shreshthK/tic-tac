export function WaitingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-dark-600 border-t-blue-500 rounded-full animate-spin" />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Waiting for opponent</h2>
        <p className="text-dark-400">
          Looking for another player to join...
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
