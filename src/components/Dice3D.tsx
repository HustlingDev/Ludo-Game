import React from 'react';
import { PlayerColor } from '../types';
import { COLOR_CONFIG } from '../utils/boardCoordinates';
import { Dices, Flame, Sparkles } from 'lucide-react';

interface Dice3DProps {
  value: number;
  isRolling: boolean;
  canRoll: boolean;
  activeColor: PlayerColor;
  isCurrentPlayerTurn: boolean;
  consecutiveSixes: number;
  onRoll: () => void;
}

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling,
  canRoll,
  activeColor,
  isCurrentPlayerTurn,
  consecutiveSixes,
  onRoll,
}) => {
  const config = COLOR_CONFIG[activeColor];

  // Helper to render pips on the dice face
  const renderPips = (val: number) => {
    const dotClasses = 'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-900 shadow-inner';
    const redDotClass = 'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-rose-600 shadow-inner';

    switch (val) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className={redDotClass} />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex justify-between p-1.5 sm:p-2">
            <div className={`${dotClasses} self-start`} />
            <div className={`${dotClasses} self-end`} />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex justify-between p-1.5 sm:p-2">
            <div className={`${dotClasses} self-start`} />
            <div className={`${dotClasses} self-center`} />
            <div className={`${dotClasses} self-end`} />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 p-1.5 sm:p-2 place-items-center">
            <div className={dotClasses} />
            <div className={dotClasses} />
            <div className={dotClasses} />
            <div className={dotClasses} />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full relative p-1.5 sm:p-2">
            <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full place-items-center">
              <div className={dotClasses} />
              <div className={dotClasses} />
              <div className={dotClasses} />
              <div className={dotClasses} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={redDotClass} />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 gap-1 p-1.5 sm:p-2 place-items-center">
            <div className={dotClasses} />
            <div className={dotClasses} />
            <div className={dotClasses} />
            <div className={dotClasses} />
            <div className={redDotClass} />
            <div className={redDotClass} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* Dice Box */}
      <div
        id="interactive-dice"
        onClick={() => {
          if (canRoll && isCurrentPlayerTurn && !isRolling) {
            onRoll();
          }
        }}
        className={`relative group select-none transition-all duration-300 ${
          canRoll && isCurrentPlayerTurn
            ? 'cursor-pointer hover:scale-105 active:scale-95'
            : 'cursor-not-allowed opacity-90'
        }`}
      >
        {/* Glow pulse behind dice */}
        {canRoll && isCurrentPlayerTurn && (
          <div
            className="absolute -inset-2 rounded-2xl opacity-60 blur-md animate-pulse"
            style={{ backgroundColor: config.accentHex }}
          />
        )}

        {/* 3D Dice Face Container */}
        <div
          className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-200 border-2 border-slate-300 shadow-xl flex items-center justify-center transition-transform ${
            isRolling ? 'animate-dice-spin' : ''
          }`}
          style={{
            boxShadow:
              '0 8px 16px -2px rgba(0, 0, 0, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 5px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* Beveled edge light */}
          <div className="absolute top-1 left-1.5 right-1.5 h-1 bg-white/80 rounded-full blur-[0.5px]" />

          {/* Dice pips */}
          {renderPips(isRolling ? ((value % 6) + 1) : value)}
        </div>
      </div>

      {/* Action Button & Status */}
      <div className="flex flex-col items-center gap-1">
        <button
          id="roll-dice-btn"
          disabled={!canRoll || !isCurrentPlayerTurn || isRolling}
          onClick={onRoll}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition-all ${
            canRoll && isCurrentPlayerTurn
              ? 'text-white active:scale-95 hover:brightness-110'
              : 'bg-slate-700/60 text-slate-400 border border-slate-600/40 cursor-not-allowed'
          }`}
          style={
            canRoll && isCurrentPlayerTurn
              ? {
                  backgroundColor: config.accentHex,
                  boxShadow: `0 4px 12px ${config.accentHex}66`,
                }
              : {}
          }
        >
          {isRolling ? (
            <>
              <Dices className="w-3.5 h-3.5 animate-spin" />
              <span>Rolling...</span>
            </>
          ) : canRoll && isCurrentPlayerTurn ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-bounce" />
              <span>Roll Dice</span>
            </>
          ) : (
            <span>Wait Turn</span>
          )}
        </button>

        {/* Streak / Bonus Info */}
        {consecutiveSixes > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30 animate-pulse">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>
              {consecutiveSixes === 1
                ? 'Bonus Roll!'
                : consecutiveSixes === 2
                ? '🔥 Double 6! (3rd loses turn)'
                : 'Turn Forfeited!'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
