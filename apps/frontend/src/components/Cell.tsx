import type { CellValue } from '@tic-tac/shared';

interface CellProps {
  value: CellValue;
  onClick: () => void;
  disabled: boolean;
  isWinningCell?: boolean;
}

export function Cell({ value, onClick, disabled, isWinningCell }: CellProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-24 h-24 text-5xl font-bold
        flex items-center justify-center
        bg-dark-800 border-2 border-dark-600
        transition-all duration-200
        ${!disabled && !value ? 'hover:bg-dark-700 hover:border-dark-500 cursor-pointer' : ''}
        ${disabled ? 'cursor-not-allowed' : ''}
        ${isWinningCell ? 'bg-green-900/30 border-green-500' : ''}
        ${value === 'X' ? 'text-blue-400' : value === 'O' ? 'text-red-400' : ''}
      `}
    >
      {value}
    </button>
  );
}
