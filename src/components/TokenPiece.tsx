import React from 'react';
import { PlayerColor, Token } from '../types';
import { COLOR_CONFIG } from '../utils/boardCoordinates';

interface TokenPieceProps {
  token: Token;
  color: PlayerColor;
  isValidMove: boolean;
  isCurrentPlayer: boolean;
  isDragging: boolean;
  stackIndex?: number;
  stackTotal?: number;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const TokenPiece: React.FC<TokenPieceProps> = ({
  token,
  color,
  isValidMove,
  isCurrentPlayer,
  isDragging,
  stackIndex = 0,
  stackTotal = 1,
  onSelect,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
}) => {
  const config = (color && COLOR_CONFIG[color]) || COLOR_CONFIG.red;

  // Offset stacking when multiple tokens share a spot
  const getStackOffset = () => {
    if (stackTotal <= 1) return { x: 0, y: 0 };
    const angle = (stackIndex / stackTotal) * 2 * Math.PI;
    const radius = 6;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const offset = getStackOffset();

  return (
    <div
      id={`token-${color}-${token.id}`}
      draggable={isValidMove && isCurrentPlayer}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        if (isValidMove && isCurrentPlayer) {
          onSelect();
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) ${
          isDragging ? 'scale(1.25)' : isValidMove ? 'scale(1.1)' : 'scale(1)'
        }`,
        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: isDragging ? 50 : isValidMove ? 30 : 20 + stackIndex,
      }}
      className={`relative cursor-pointer select-none transition-all flex items-center justify-center ${
        isValidMove && isCurrentPlayer ? 'animate-bounce-subtle' : ''
      }`}
    >
      {/* Halo glow for valid moves */}
      {isValidMove && isCurrentPlayer && (
        <span
          className="absolute -inset-1.5 rounded-full animate-ping opacity-75"
          style={{ backgroundColor: config.accentHex }}
        />
      )}

      {/* Pawn Base & Shadow */}
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center">
        {/* Soft ground shadow */}
        <div className="absolute -bottom-1 w-7 h-2.5 bg-black/40 rounded-full blur-[2px]" />

        {/* Outer 3D ring */}
        <div
          className={`w-full h-full rounded-full p-[2.5px] shadow-lg flex items-center justify-center transition-shadow ${
            isValidMove && isCurrentPlayer
              ? 'ring-2 ring-white ring-offset-1 ring-offset-black/20 shadow-amber-300/50 shadow-md'
              : ''
          }`}
          style={{
            background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${config.accentHex} 45%, ${config.darkHex} 100%)`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), inset 0 2px 3px rgba(255, 255, 255, 0.6), inset 0 -2px 3px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Inner pawn dome */}
          <div
            className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden"
            style={{
              backgroundColor: '#ffffff',
              background: `radial-gradient(circle at 40% 35%, #ffffff 10%, ${config.lightHex} 60%, ${config.accentHex} 100%)`,
            }}
          >
            {/* Top glass specular highlight */}
            <div className="absolute top-0.5 left-1 w-2.5 h-1.5 bg-white/80 rounded-full rotate-[-20deg] blur-[0.4px]" />

            {/* Token ID or Crown indicator */}
            <span
              className="text-[11px] sm:text-xs font-black drop-shadow-sm"
              style={{ color: config.darkHex }}
            >
              {token.id + 1}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
