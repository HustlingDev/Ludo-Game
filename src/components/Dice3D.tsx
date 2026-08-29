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
  const config = (activeColor && COLOR_CONFIG[activeColor]) || COLOR_CONFIG.red;

  // Exact 3D rotation angles to bring each target face to the front
  const getCubeRotation = (val: number) => {
    switch (val) {
      case 1:
        return 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
      case 2:
        return 'rotateX(-90deg) rotateY(0deg) rotateZ(0deg)';
      case 3:
        return 'rotateX(0deg) rotateY(-90deg) rotateZ(0deg)';
      case 4:
        return 'rotateX(0deg) rotateY(90deg) rotateZ(0deg)';
      case 5:
        return 'rotateX(90deg) rotateY(0deg) rotateZ(0deg)';
      case 6:
        return 'rotateX(180deg) rotateY(0deg) rotateZ(0deg)';
      default:
        return 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    }
  };

  // Helper to render pips on each specific dice face
  const renderFacePips = (val: number) => {
    const dotClasses = 'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-900 shadow-inner';
    const redDotClass = 'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-600 shadow-inner';

    switch (val) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className={`${redDotClass} scale-125`} />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex justify-between p-1.5">
            <div className={`${dotClasses} self-start`} />
            <div className={`${dotClasses} self-end`} />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex justify-between p-1.5">
            <div className={`${dotClasses} self-start`} />
            <div className={`${dotClasses} self-center`} />
            <div className={`${dotClasses} self-end`} />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 place-items-center">
            <div className={dotClasses} />
            <div className={dotClasses} />
            <div className={dotClasses} />
            <div className={dotClasses} />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full relative p-1.5">
            <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full place-items-center">
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
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 gap-1 p-1 place-items-center">
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

  const faceBaseStyle =
    'absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300 shadow-md flex items-center justify-center select-none overflow-hidden';

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* 3D Dice Stage & Perspective Viewport */}
      <div
        id="interactive-dice"
        onClick={() => {
          if (canRoll && isCurrentPlayerTurn && !isRolling) {
            onRoll();
          }
        }}
        className={`relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center select-none perspective-800 ${
          canRoll && isCurrentPlayerTurn
            ? 'cursor-pointer group'
            : 'cursor-not-allowed opacity-90'
        }`}
      >
        {/* Glow halo behind dice */}
        {canRoll && isCurrentPlayerTurn && (
          <div
            className="absolute inset-1 rounded-full opacity-60 blur-lg animate-pulse pointer-events-none transition-all duration-300 group-hover:opacity-90 group-hover:scale-110"
            style={{ backgroundColor: config.accentHex }}
          />
        )}

        {/* Dynamic 3D Ground Shadow */}
        <div
          className={`absolute bottom-0 w-12 h-3.5 sm:w-14 sm:h-4 rounded-[100%] bg-black/60 blur-[3px] pointer-events-none transition-all duration-300 ${
            isRolling ? 'animate-dice-shadow' : ''
          }`}
        />

        {/* 3D Rolling Cube */}
        <div
          className={`relative w-12 h-12 sm:w-14 sm:h-14 transform-style-3d transition-transform duration-500 ease-out ${
            isRolling ? 'animate-dice-tumble' : ''
          }`}
          style={{
            transform: isRolling ? undefined : getCubeRotation(value),
          }}
        >
          {/* Face 1: Front (Z: +28px) */}
          <div
            className={faceBaseStyle}
            style={{ transform: 'rotateY(0deg) translateZ(28px)' }}
          >
            <div className="absolute top-0.5 left-1 right-1 h-0.5 bg-white/90 rounded-full" />
            {renderFacePips(1)}
          </div>

          {/* Face 6: Back (Z: -28px / rotateX 180) */}
          <div
            className={faceBaseStyle}
            style={{ transform: 'rotateX(180deg) translateZ(28px)' }}
          >
            <div className="absolute top-0.5 left-1 right-1 h-0.5 bg-white/90 rounded-full" />
            {renderFacePips(6)}
          </div>

          {/* Face 3: Right (rotateY +90) */}
          <div
            className={faceBaseStyle}
            style={{ transform: 'rotateY(90deg) translateZ(28px)' }}
          >
            <div className="absolute top-0.5 left-1 right-1 h-0.5 bg-white/90 rounded-full" />
            {renderFacePips(3)}
          </div>

          {/* Face 4: Left (rotateY -90) */}
          <div
            className={faceBaseStyle}
            style={{ transform: 'rotateY(-90deg) translateZ(28px)' }}
          >
            <div className="absolute top-0.5 left-1 right-1 h-0.5 bg-white/90 rounded-full" />
            {renderFacePips(4)}
          </div>

          {/* Face 2: Top (rotateX +90) */}
          <div
            className={faceBaseStyle}
            style={{ transform: 'rotateX(90deg) translateZ(28px)' }}
          >
            <div className="absolute top-0.5 left-1 right-1 h-0.5 bg-white/90 rounded-full" />
            {renderFacePips(2)}
          </div>

          {/* Face 5: Bottom (rotateX -90) */}
          <div
            className={faceBaseStyle}
            style={{ transform: 'rotateX(-90deg) translateZ(28px)' }}
          >
            <div className="absolute top-0.5 left-1 right-1 h-0.5 bg-white/90 rounded-full" />
            {renderFacePips(5)}
          </div>
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
              <span>3D Rolling...</span>
            </>
          ) : canRoll && isCurrentPlayerTurn ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-bounce" />
              <span>Roll 3D Dice</span>
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

