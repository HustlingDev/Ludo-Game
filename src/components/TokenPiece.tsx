import React from 'react';
import { PlayerColor, Token } from '../types';
import { COLOR_CONFIG } from '../utils/boardCoordinates';

export interface TokenPieceProps {
  token: Token;
  color: PlayerColor;
  isValidMove: boolean;
  isCurrentPlayer: boolean;
  isDragging?: boolean;
  isHovered?: boolean;
  stackIndex?: number;
  stackTotal?: number;
  onSelect: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const TokenPiece: React.FC<TokenPieceProps> = ({
  token,
  color,
  isValidMove,
  isCurrentPlayer,
  isDragging = false,
  isHovered = false,
  stackIndex = 0,
  stackTotal = 1,
  onSelect,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
}) => {
  const config = (color && COLOR_CONFIG[color]) || COLOR_CONFIG.red;

  // Offset stacking when multiple tokens share a spot on the common track
  const getStackOffset = () => {
    if (stackTotal <= 1) return { x: 0, y: 0 };
    const angle = (stackIndex / stackTotal) * 2 * Math.PI;
    const radius = 4;
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
          isDragging ? 'scale(1.28)' : isHovered && isValidMove ? 'scale(1.2)' : isValidMove ? 'scale(1.12)' : 'scale(1)'
        }`,
        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: isDragging ? 50 : isValidMove ? 30 : 20 + stackIndex,
      }}
      className={`relative cursor-pointer select-none transition-all flex items-center justify-center ${
        isValidMove && isCurrentPlayer ? 'animate-bounce' : ''
      }`}
    >
      {/* Halo glow for valid moves */}
      {isValidMove && isCurrentPlayer && (
        <span
          className="absolute -inset-1 rounded-full animate-ping opacity-75 pointer-events-none"
          style={{ backgroundColor: config.accentHex }}
        />
      )}

      {/* Pawn Base & Shadow */}
      <div className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center">
        {/* Soft ground shadow */}
        <div className="absolute -bottom-1 w-5 h-2 bg-black/40 rounded-full blur-[1.5px]" />

        {/* Outer 3D ring */}
        <div
          className={`w-full h-full rounded-full p-[2px] shadow-lg flex items-center justify-center transition-shadow ${
            isValidMove && isCurrentPlayer
              ? 'ring-2 ring-white ring-offset-1 ring-offset-black/20 shadow-amber-300/60 shadow-md'
              : ''
          }`}
          style={{
            background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${config.accentHex} 45%, ${config.darkHex} 100%)`,
            boxShadow:
              '0 3px 5px -1px rgba(0, 0, 0, 0.35), inset 0 1.5px 2px rgba(255, 255, 255, 0.7), inset 0 -1.5px 2px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Inner pawn dome */}
          <div
            className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden"
            style={{
              backgroundColor: '#ffffff',
              background: `radial-gradient(circle at 40% 35%, #ffffff 10%, ${config.lightHex} 60%, ${config.accentHex} 100%)`,
            }}
          >
            {/* Top glass specular highlight */}
            <div className="absolute top-0.5 left-0.5 w-2 h-1 bg-white/80 rounded-full rotate-[-20deg] blur-[0.3px]" />

            {/* Token ID number */}
            <span
              className="text-[10px] sm:text-[11px] font-black drop-shadow-sm leading-none"
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
