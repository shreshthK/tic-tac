import type { CellValue } from '@tic-tac/shared';

interface CellProps {
  value: CellValue;
  onClick: () => void;
  disabled: boolean;
  isWinningCell?: boolean;
}

export function Cell({ value, onClick, disabled, isWinningCell }: CellProps) {
  const baseClasses = `
    relative w-28 h-28 sm:w-32 sm:h-32
    flex items-center justify-center
    font-display text-6xl sm:text-7xl font-black
    transition-all duration-300 ease-out
    border border-void-200/20
    overflow-hidden
  `;

  const emptyHoverClasses = !disabled && !value
    ? 'cursor-pointer hover:bg-neon-cyan/5 hover:border-neon-cyan/30 group'
    : '';

  const disabledClasses = disabled ? 'cursor-not-allowed' : '';

  const winningClasses = isWinningCell
    ? 'bg-victory-gold/10 border-victory-gold/50 animate-glow-pulse'
    : '';

  const getValueClasses = () => {
    if (value === 'X') {
      return `text-neon-cyan ${isWinningCell ? 'text-glow-gold' : 'text-glow-cyan'}`;
    }
    if (value === 'O') {
      return `text-plasma-pink ${isWinningCell ? 'text-glow-gold' : 'text-glow-pink'}`;
    }
    return '';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${emptyHoverClasses}
        ${disabledClasses}
        ${winningClasses}
        ${getValueClasses()}
      `}
    >
      {/* Background glow effect when cell has value */}
      {value && (
        <div
          className={`
            absolute inset-0 opacity-20 blur-xl
            ${value === 'X' ? 'bg-neon-cyan' : 'bg-plasma-pink'}
            ${isWinningCell ? 'opacity-40 bg-victory-gold' : ''}
          `}
        />
      )}

      {/* Hover indicator for empty cells */}
      {!value && !disabled && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neon-cyan/30 animate-pulse" />
        </div>
      )}

      {/* The symbol */}
      <span className={`relative z-10 ${value ? 'animate-fade-in' : ''}`}>
        {value}
      </span>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-neon-cyan/20" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-neon-cyan/20" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-neon-cyan/20" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-neon-cyan/20" />
    </button>
  );
}
