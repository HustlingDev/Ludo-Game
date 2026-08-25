import React, { useMemo } from 'react';
import { GameState, PlayerColor, BoardTheme, Token } from '../types';
import {
  getTokenGridPosition,
  COLOR_CONFIG,
  START_TRACK_INDEX,
  isSafeTrackIndex,
  GridCoord,
} from '../utils/boardCoordinates';
import { TokenPiece } from './TokenPiece';
import { Star, Crown, ArrowRight, ArrowUp, ArrowLeft, ArrowDown } from 'lucide-react';

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  theme: BoardTheme;
  draggedTokenId: number | null;
  hoveredTokenId: number | null;
  setDraggedTokenId: (id: number | null) => void;
  setHoveredTokenId: (id: number | null) => void;
  onMoveToken: (tokenId: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  myPlayerId,
  theme,
  draggedTokenId,
  hoveredTokenId,
  setDraggedTokenId,
  setHoveredTokenId,
  onMoveToken,
}) => {
  const activeColor = gameState.activeColors[gameState.activeColorIndex];
  const activePlayer = gameState.players.find((p) => p.color === activeColor);
  const isMyTurn =
    gameState.mode === 'online_multiplayer'
      ? activePlayer?.id === myPlayerId
      : activePlayer?.type === 'human';

  // Find target destination if a token is hovered or dragged
  const targetCoord = useMemo<GridCoord | null>(() => {
    const focusedId = draggedTokenId ?? hoveredTokenId;
    if (focusedId === null || !activePlayer || !gameState.mustSelectToken) return null;
    if (!gameState.validTokenMoves.includes(focusedId)) return null;

    const token = activePlayer.tokens.find((t) => t.id === focusedId);
    if (!token) return null;

    if (token.state === 'YARD' && gameState.diceValue === 6) {
      return getTokenGridPosition(activePlayer.color, 0, 0);
    }
    if (token.state === 'TRACK' || token.state === 'HOME_STRETCH') {
      const nextStep = token.step + gameState.diceValue;
      if (nextStep <= 56) {
        return getTokenGridPosition(activePlayer.color, nextStep, 0);
      }
    }
    return null;
  }, [draggedTokenId, hoveredTokenId, activePlayer, gameState.mustSelectToken, gameState.validTokenMoves, gameState.diceValue]);

  // Group tokens by their board coordinates to render tokens on top of the board
  const tokensOnBoard = useMemo(() => {
    const list: {
      token: Token;
      coord: GridCoord;
      player: (typeof gameState.players)[0];
      isValid: boolean;
    }[] = [];

    gameState.players.forEach((p) => {
      p.tokens.forEach((t) => {
        const coord = getTokenGridPosition(p.color, t.step, t.yardIndex);
        const isValid =
          p.color === activeColor &&
          gameState.mustSelectToken &&
          gameState.validTokenMoves.includes(t.id);
        list.push({ token: t, coord, player: p, isValid });
      });
    });

    return list;
  }, [gameState.players, activeColor, gameState.mustSelectToken, gameState.validTokenMoves]);

  // Map theme styles
  const getThemeBoardStyle = () => {
    switch (theme) {
      case 'classic_wood':
        return 'bg-[#2b1810] border-[#5c3a21] text-amber-100 shadow-2xl';
      case 'modern_neon':
        return 'bg-slate-950 border-cyan-500/40 text-cyan-200 shadow-[0_0_50px_rgba(6,182,212,0.15)]';
      case 'nordic_minimal':
        return 'bg-slate-100 border-slate-300 text-slate-800 shadow-xl';
      case 'vibrant_carnival':
      default:
        return 'bg-slate-900 border-slate-700/80 text-white shadow-2xl';
    }
  };

  const getThemeBaseBoxStyle = (color: PlayerColor) => {
    const config = COLOR_CONFIG[color];
    switch (theme) {
      case 'classic_wood':
        return `${config.bgClass} bg-opacity-90 border-4 border-[#3e2415] shadow-inner`;
      case 'modern_neon':
        return `bg-slate-900 border-2 border-[${config.accentHex}] shadow-[0_0_15px_${config.accentHex}40]`;
      case 'nordic_minimal':
        return `${config.bgClass} bg-opacity-20 border-2 ${config.borderClass}`;
      case 'vibrant_carnival':
      default:
        return `${config.bgClass} border-4 border-slate-950/40 shadow-inner`;
    }
  };

  // Drag Drop Handlers for cells
  const handleCellDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    if (draggedTokenId === null || !activePlayer || !isMyTurn) return;

    if (targetCoord && targetCoord.row === row && targetCoord.col === col) {
      onMoveToken(draggedTokenId);
    }
    setDraggedTokenId(null);
  };

  const handleCellDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Helper to render Yard Base with 4 pawn slots
  const renderYardBase = (color: PlayerColor, rowStart: number, colStart: number) => {
    const config = COLOR_CONFIG[color];
    const player = gameState.players.find((p) => p.color === color);
    const yardTokens = player?.tokens.filter((t) => t.state === 'YARD') || [];

    return (
      <div
        className={`relative col-span-6 row-span-6 rounded-3xl p-3 sm:p-4 flex items-center justify-center overflow-hidden ${getThemeBaseBoxStyle(
          color
        )}`}
        style={{
          gridRow: `${rowStart} / span 6`,
          gridColumn: `${colStart} / span 6`,
        }}
      >
        {/* Decorative corner crest */}
        <div className="absolute top-2 left-3 flex items-center gap-1 opacity-80">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white drop-shadow">
            {config.name}
          </span>
        </div>

        {/* Inner white/contrast plate */}
        <div className="w-[82%] h-[82%] rounded-2xl bg-white/95 dark:bg-slate-900/90 shadow-lg p-2 sm:p-3 grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 place-items-center border border-black/10">
          {[0, 1, 2, 3].map((slotIdx) => {
            const tokenInSlot = yardTokens.find((t) => t.yardIndex === slotIdx);
            const isValid =
              tokenInSlot &&
              player?.color === activeColor &&
              gameState.mustSelectToken &&
              gameState.validTokenMoves.includes(tokenInSlot.id);

            return (
              <div
                key={`yard-slot-${color}-${slotIdx}`}
                className="relative w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-slate-200/80 dark:bg-slate-800/80 shadow-inner flex items-center justify-center border-2 border-black/10"
              >
                {/* Sunk-in socket shadow */}
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full opacity-30 shadow-inner"
                  style={{ backgroundColor: config.accentHex }}
                />

                {tokenInSlot && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TokenPiece
                      token={tokenInSlot}
                      color={color}
                      isValidMove={Boolean(isValid)}
                      isCurrentPlayer={Boolean(isMyTurn && player?.color === activeColor)}
                      isDragging={draggedTokenId === tokenInSlot.id}
                      onSelect={() => onMoveToken(tokenInSlot.id)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', String(tokenInSlot.id));
                        setDraggedTokenId(tokenInSlot.id);
                      }}
                      onDragEnd={() => setDraggedTokenId(null)}
                      onMouseEnter={() => setHoveredTokenId(tokenInSlot.id)}
                      onMouseLeave={() => setHoveredTokenId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper to render Center Home Triangle
  const renderHomeCenter = () => {
    const homeTokens = gameState.players.flatMap((p) =>
      p.tokens.filter((t) => t.state === 'HOME').map((t) => ({ token: t, player: p }))
    );

    return (
      <div
        className="col-span-3 row-span-3 relative bg-slate-950 border-2 border-slate-700/80 shadow-2xl overflow-hidden"
        style={{
          gridRow: '7 / span 3',
          gridColumn: '7 / span 3',
        }}
        onDragOver={handleCellDragOver}
        onDrop={(e) => handleCellDrop(e, 7, 7)}
      >
        {/* SVG Colored 4 Triangular Wedges */}
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
          {/* Top Triangle - Green */}
          <polygon points="0,0 100,0 50,50" fill={COLOR_CONFIG.green.accentHex} opacity="0.9" />
          {/* Right Triangle - Yellow */}
          <polygon points="100,0 100,100 50,50" fill={COLOR_CONFIG.yellow.accentHex} opacity="0.9" />
          {/* Bottom Triangle - Blue */}
          <polygon points="100,100 0,100 50,50" fill={COLOR_CONFIG.blue.accentHex} opacity="0.9" />
          {/* Left Triangle - Red */}
          <polygon points="0,100 0,0 50,50" fill={COLOR_CONFIG.red.accentHex} opacity="0.9" />
        </svg>

        {/* Center Golden Medallion */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-xl border-2 border-amber-100 flex items-center justify-center">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 drop-shadow" />
          </div>
        </div>

        {/* Home Finished Tokens Display */}
        {homeTokens.length > 0 && (
          <div className="absolute inset-0 flex flex-wrap items-center justify-center p-1 gap-1 z-20 pointer-events-none">
            {homeTokens.slice(0, 4).map(({ token, player }, idx) => (
              <div
                key={`home-tok-${token.color}-${token.id}`}
                className="w-4 h-4 rounded-full border border-white shadow-sm flex items-center justify-center text-[9px] font-black text-white"
                style={{ backgroundColor: COLOR_CONFIG[token.color].accentHex }}
              >
                ✓
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper to render a specific grid cell (row: 0..14, col: 0..14)
  const renderCell = (row: number, col: number) => {
    // Check if cell is in any Yard quadrant
    if (row < 6 && col < 6) return null; // Red Yard (rendered via base)
    if (row < 6 && col > 8) return null; // Green Yard
    if (row > 8 && col < 6) return null; // Blue Yard
    if (row > 8 && col > 8) return null; // Yellow Yard
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null; // Center Home

    // Identify cell types
    // Red Start: (6, 1)
    const isRedStart = row === 6 && col === 1;
    // Green Start: (1, 8)
    const isGreenStart = row === 1 && col === 8;
    // Yellow Start: (8, 13)
    const isYellowStart = row === 8 && col === 13;
    // Blue Start: (13, 6)
    const isBlueStart = row === 13 && col === 6;

    // Home Stretches
    const isRedHome = row === 7 && col >= 1 && col <= 5;
    const isGreenHome = col === 7 && row >= 1 && row <= 5;
    const isYellowHome = row === 7 && col >= 9 && col <= 13;
    const isBlueHome = col === 7 && row >= 9 && row <= 13;

    // Safe Stars
    const isSafeStar =
      (row === 2 && col === 6) ||
      (row === 6 && col === 12) ||
      (row === 12 && col === 8) ||
      (row === 8 && col === 2);

    // Is this cell the target drop location for current hovered/dragged token?
    const isTargetCell = targetCoord && targetCoord.row === row && targetCoord.col === col;

    // Find tokens on this cell
    const tokensHere = tokensOnBoard.filter(
      (item) => item.coord.row === row && item.coord.col === col && item.token.state !== 'YARD'
    );

    let bgStyle = 'bg-white/90 dark:bg-slate-800/80';
    let arrowIcon = null;

    if (isRedStart) {
      bgStyle = 'bg-rose-500 text-white font-black';
      arrowIcon = <ArrowRight className="w-3.5 h-3.5 opacity-90" />;
    } else if (isGreenStart) {
      bgStyle = 'bg-emerald-500 text-white font-black';
      arrowIcon = <ArrowDown className="w-3.5 h-3.5 opacity-90" />;
    } else if (isYellowStart) {
      bgStyle = 'bg-amber-400 text-slate-950 font-black';
      arrowIcon = <ArrowLeft className="w-3.5 h-3.5 opacity-90" />;
    } else if (isBlueStart) {
      bgStyle = 'bg-sky-500 text-white font-black';
      arrowIcon = <ArrowUp className="w-3.5 h-3.5 opacity-90" />;
    } else if (isRedHome) {
      bgStyle = 'bg-rose-400/90 text-white';
    } else if (isGreenHome) {
      bgStyle = 'bg-emerald-400/90 text-white';
    } else if (isYellowHome) {
      bgStyle = 'bg-amber-300/90 text-slate-900';
    } else if (isBlueHome) {
      bgStyle = 'bg-sky-400/90 text-white';
    }

    return (
      <div
        key={`cell-${row}-${col}`}
        id={`board-cell-${row}-${col}`}
        onDragOver={handleCellDragOver}
        onDrop={(e) => handleCellDrop(e, row, col)}
        style={{
          gridRow: row + 1,
          gridColumn: col + 1,
        }}
        className={`relative w-full h-full border border-black/10 dark:border-white/10 flex items-center justify-center transition-colors duration-150 ${bgStyle} ${
          isTargetCell
            ? 'ring-4 ring-amber-400 ring-inset animate-pulse bg-amber-200/50'
            : ''
        }`}
      >
        {/* Star Icon for Safe Squares */}
        {isSafeStar && (
          <div className="absolute inset-0 flex items-center justify-center opacity-40">
            <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
          </div>
        )}

        {/* Start Arrow */}
        {arrowIcon && <div className="absolute inset-0 flex items-center justify-center">{arrowIcon}</div>}

        {/* Target Destination Indicator */}
        {isTargetCell && (
          <div className="absolute inset-0 bg-amber-400/30 flex items-center justify-center animate-ping">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
          </div>
        )}

        {/* Tokens stacked on this cell */}
        {tokensHere.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            {tokensHere.map((item, idx) => (
              <TokenPiece
                key={`tok-${item.player.color}-${item.token.id}`}
                token={item.token}
                color={item.player.color}
                isValidMove={item.isValid}
                isCurrentPlayer={Boolean(isMyTurn && item.player.color === activeColor)}
                isDragging={draggedTokenId === item.token.id}
                stackIndex={idx}
                stackTotal={tokensHere.length}
                onSelect={() => onMoveToken(item.token.id)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(item.token.id));
                  setDraggedTokenId(item.token.id);
                }}
                onDragEnd={() => setDraggedTokenId(null)}
                onMouseEnter={() => setHoveredTokenId(item.token.id)}
                onMouseLeave={() => setHoveredTokenId(null)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[540px] aspect-square mx-auto select-none">
      {/* Outer Board Frame */}
      <div
        className={`w-full h-full p-2.5 sm:p-3 rounded-3xl border-4 shadow-2xl relative transition-all duration-300 flex items-center justify-center ${getThemeBoardStyle()}`}
      >
        {/* 15x15 CSS Grid Canvas */}
        <div className="w-full h-full grid grid-cols-15 grid-rows-15 rounded-2xl overflow-hidden border border-black/20 shadow-inner bg-slate-200 dark:bg-slate-800">
          {/* 4 Corner Yard Bases */}
          {renderYardBase('red', 1, 1)}
          {renderYardBase('green', 1, 10)}
          {renderYardBase('blue', 10, 1)}
          {renderYardBase('yellow', 10, 10)}

          {/* Center Home */}
          {renderHomeCenter()}

          {/* All Track Cells */}
          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => renderCell(r, c))
          )}
        </div>
      </div>
    </div>
  );
};
