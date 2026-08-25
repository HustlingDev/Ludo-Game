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
import { Star, Crown, ArrowRight, ArrowUp, ArrowLeft, ArrowDown, Sparkles } from 'lucide-react';

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

  // Destination tile calculation
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
  }, [
    draggedTokenId,
    hoveredTokenId,
    activePlayer,
    gameState.mustSelectToken,
    gameState.validTokenMoves,
    gameState.diceValue,
  ]);

  // Group tokens for top-level overlay
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

  // Theme board outer container style
  const getThemeBoardStyle = () => {
    switch (theme) {
      case 'classic_arrows':
        return 'bg-amber-50 border-4 border-slate-800 text-slate-900 shadow-2xl';
      case 'star_minimal':
        return 'bg-white border-4 border-slate-700 text-slate-800 shadow-xl';
      case 'geometric_diamond':
        return 'bg-[#fff8e7] border-4 border-slate-950 text-slate-900 shadow-2xl';
      case 'classic_wood':
        return 'bg-[#26150c] border-4 border-[#4d2d18] text-amber-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)]';
      case 'modern_neon':
      default:
        return 'bg-slate-950 border-2 border-cyan-500/50 text-cyan-200 shadow-[0_0_50px_rgba(6,182,212,0.2)]';
    }
  };

  // Drag and drop handler
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

  // Yard base renderer based on template (Image 1, 2, 3 styles)
  const renderYardBase = (color: PlayerColor, rowStart: number, colStart: number) => {
    const config = (color && COLOR_CONFIG[color]) || COLOR_CONFIG.red;
    const player = gameState.players.find((p) => p.color === color);
    const yardTokens = player?.tokens.filter((t) => t.state === 'YARD') || [];

    // Template 3: Retro Geometric Diamond Yard
    if (theme === 'geometric_diamond') {
      return (
        <div
          className={`relative col-span-6 row-span-6 p-2 flex items-center justify-center overflow-hidden border-2 border-slate-950`}
          style={{
            gridRow: `${rowStart} / span 6`,
            gridColumn: `${colStart} / span 6`,
            backgroundColor: config.accentHex,
          }}
        >
          {/* Rotated Diamond Base */}
          <div className="w-[78%] h-[78%] bg-white border-4 border-slate-950 rotate-45 flex items-center justify-center shadow-lg">
            <div className="w-[82%] h-[82%] border-2 border-slate-950 grid grid-cols-2 grid-rows-2 p-1.5 gap-1 bg-[#fff8e7]">
              {[0, 1, 2, 3].map((slotIdx) => (
                <div
                  key={slotIdx}
                  className="w-full h-full rounded border-2 border-slate-950 flex items-center justify-center"
                  style={{ backgroundColor: config.accentHex }}
                />
              ))}
            </div>
          </div>
          <div className="absolute top-1 left-2 text-[10px] font-black text-white uppercase tracking-wider drop-shadow">
            {config.name}
          </div>
        </div>
      );
    }

    // Template 2: Star Minimal Circular Pockets (Image 2)
    if (theme === 'star_minimal') {
      return (
        <div
          className="relative col-span-6 row-span-6 p-3 flex items-center justify-center overflow-hidden border-2 border-slate-300"
          style={{
            gridRow: `${rowStart} / span 6`,
            gridColumn: `${colStart} / span 6`,
            backgroundColor: config.accentHex,
          }}
        >
          {/* Large Inner White Panel */}
          <div className="w-[80%] h-[80%] bg-white rounded-2xl border-2 border-slate-400 p-2 grid grid-cols-2 grid-rows-2 gap-2 shadow-inner">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className="rounded-full border-2 border-slate-300 flex items-center justify-center"
                style={{ backgroundColor: config.accentHex }}
              />
            ))}
          </div>
          <div className="absolute top-1.5 left-2.5 text-[10px] font-black text-white uppercase tracking-wider">
            {config.name}
          </div>
        </div>
      );
    }

    // Template 1 & Classic / Modern (Image 1 style)
    return (
      <div
        className={`relative col-span-6 row-span-6 p-2.5 sm:p-3 flex items-center justify-center overflow-hidden border-2 border-slate-900`}
        style={{
          gridRow: `${rowStart} / span 6`,
          gridColumn: `${colStart} / span 6`,
          backgroundColor:
            theme === 'classic_wood'
              ? `${config.accentHex}dd`
              : theme === 'modern_neon'
              ? '#090d16'
              : config.accentHex,
          borderColor: theme === 'modern_neon' ? config.accentHex : undefined,
          boxShadow: theme === 'modern_neon' ? `0 0 20px ${config.accentHex}40` : undefined,
        }}
      >
        {/* Inner Yard White Box */}
        <div
          className={`w-[78%] h-[78%] rounded-xl flex items-center justify-center shadow-inner border-2 ${
            theme === 'classic_wood'
              ? 'bg-[#edd9be] border-[#5c3a21]'
              : theme === 'modern_neon'
              ? 'bg-slate-900 border-slate-700'
              : 'bg-white border-slate-800'
          }`}
        >
          <div className="w-full h-full p-2 grid grid-cols-2 grid-rows-2 gap-2">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className={`rounded-lg border-2 flex items-center justify-center shadow-sm ${
                  theme === 'modern_neon' ? 'border-slate-700' : 'border-slate-800'
                }`}
                style={{ backgroundColor: config.accentHex }}
              />
            ))}
          </div>
        </div>

        {/* Team Label */}
        <div className="absolute top-1.5 left-2 flex items-center gap-1">
          <span className="text-[10px] font-black uppercase text-white drop-shadow">
            {config.name}
          </span>
          {yardTokens.length > 0 && (
            <span className="text-[9px] px-1 bg-black/40 text-white rounded font-mono font-bold">
              {yardTokens.length}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Center Home Triangle (Center 3x3 at rows 6..8, cols 6..8)
  const renderCenterHome = () => {
    return (
      <div
        className="relative col-span-3 row-span-3 border-2 border-slate-950 overflow-hidden shadow-inner"
        style={{
          gridRow: '7 / span 3',
          gridColumn: '7 / span 3',
        }}
      >
        {/* SVG Triangles for 4 Home colors */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Top: Green Triangle */}
          <polygon
            points="0,0 100,0 50,50"
            fill={COLOR_CONFIG.green.accentHex}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* Right: Yellow Triangle */}
          <polygon
            points="100,0 100,100 50,50"
            fill={COLOR_CONFIG.yellow.accentHex}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* Bottom: Blue Triangle */}
          <polygon
            points="0,100 100,100 50,50"
            fill={COLOR_CONFIG.blue.accentHex}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* Left: Red Triangle */}
          <polygon
            points="0,0 0,100 50,50"
            fill={COLOR_CONFIG.red.accentHex}
            stroke="#0f172a"
            strokeWidth="1.5"
          />

          {/* Center Trophy Icon Circle */}
          <circle cx="50" cy="50" r="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
        </div>
      </div>
    );
  };

  // Render Track and Home-stretch cell (row, col)
  const renderCell = (row: number, col: number) => {
    // Skip 4 corner bases (6x6 each) and center home (3x3)
    if (row < 6 && col < 6) return null;
    if (row < 6 && col > 8) return null;
    if (row > 8 && col < 6) return null;
    if (row > 8 && col > 8) return null;
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null;

    const isTarget = targetCoord && targetCoord.row === row && targetCoord.col === col;

    // Determine cell characteristics
    let cellBg =
      theme === 'classic_wood'
        ? 'bg-[#edd9be]'
        : theme === 'modern_neon'
        ? 'bg-slate-900'
        : 'bg-white';
    let isStart = false;
    let isSafe = false;
    let isHomeStretch = false;
    let cellColor: PlayerColor | null = null;
    let arrowDir: 'right' | 'left' | 'up' | 'down' | null = null;

    // Home Stretches
    if (row === 7 && col >= 1 && col <= 5) {
      isHomeStretch = true;
      cellColor = 'red';
      cellBg = COLOR_CONFIG.red.bgClass;
    } else if (col === 7 && row >= 1 && row <= 5) {
      isHomeStretch = true;
      cellColor = 'green';
      cellBg = COLOR_CONFIG.green.bgClass;
    } else if (row === 7 && col >= 9 && col <= 13) {
      isHomeStretch = true;
      cellColor = 'yellow';
      cellBg = COLOR_CONFIG.yellow.bgClass;
    } else if (col === 7 && row >= 9 && row <= 13) {
      isHomeStretch = true;
      cellColor = 'blue';
      cellBg = COLOR_CONFIG.blue.bgClass;
    }

    // Start Cells
    if (row === 6 && col === 1) {
      isStart = true;
      cellColor = 'red';
      cellBg = COLOR_CONFIG.red.bgClass;
      arrowDir = 'right';
    } else if (row === 1 && col === 8) {
      isStart = true;
      cellColor = 'green';
      cellBg = COLOR_CONFIG.green.bgClass;
      arrowDir = 'down';
    } else if (row === 8 && col === 13) {
      isStart = true;
      cellColor = 'yellow';
      cellBg = COLOR_CONFIG.yellow.bgClass;
      arrowDir = 'left';
    } else if (row === 13 && col === 6) {
      isStart = true;
      cellColor = 'blue';
      cellBg = COLOR_CONFIG.blue.bgClass;
      arrowDir = 'up';
    }

    // Safe Stars (non-start stars)
    if (
      (row === 2 && col === 6) ||
      (row === 6 && col === 12) ||
      (row === 12 && col === 8) ||
      (row === 8 && col === 2)
    ) {
      isSafe = true;
    }

    // Home entry arrows (Classic template Image 1 & 2)
    let entryArrow: 'right' | 'left' | 'up' | 'down' | null = null;
    if (row === 7 && col === 0) entryArrow = 'right';
    if (row === 0 && col === 7) entryArrow = 'down';
    if (row === 7 && col === 14) entryArrow = 'left';
    if (row === 14 && col === 7) entryArrow = 'up';

    return (
      <div
        key={`cell-${row}-${col}`}
        onDragOver={handleCellDragOver}
        onDrop={(e) => handleCellDrop(e, row, col)}
        onClick={() => {
          if (isTarget && draggedTokenId !== null) {
            onMoveToken(draggedTokenId);
            setDraggedTokenId(null);
          }
        }}
        className={`relative border border-slate-900 flex items-center justify-center select-none transition-all ${cellBg} ${
          isTarget
            ? 'ring-4 ring-amber-400 ring-inset animate-pulse bg-amber-200/90 z-10 cursor-pointer shadow-lg'
            : ''
        }`}
        style={{
          gridRow: `${row + 1} / span 1`,
          gridColumn: `${col + 1} / span 1`,
        }}
      >
        {/* Star Icon for Safe Squares */}
        {(isSafe || isStart) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-85">
            <Star
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                isStart ? 'text-white fill-white' : 'text-slate-800 fill-amber-400'
              }`}
            />
          </div>
        )}

        {/* Direction Arrows on Start Cells or Home Entry */}
        {(arrowDir || entryArrow) && !isSafe && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/90">
            {(arrowDir === 'right' || entryArrow === 'right') && (
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            {(arrowDir === 'down' || entryArrow === 'down') && (
              <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            {(arrowDir === 'left' || entryArrow === 'left') && (
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            {(arrowDir === 'up' || entryArrow === 'up') && (
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </div>
        )}

        {/* Target Destination Glow Marker */}
        {isTarget && (
          <div className="absolute inset-1 rounded-full bg-amber-400/40 border-2 border-amber-400 flex items-center justify-center animate-ping" />
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex items-center justify-center p-1 sm:p-2">
      {/* 15x15 Board Grid Container */}
      <div
        className={`relative w-full aspect-square max-w-[480px] sm:max-w-[520px] rounded-3xl p-1.5 sm:p-2 shadow-2xl grid grid-cols-15 grid-rows-15 border-4 select-none touch-manipulation ${getThemeBoardStyle()}`}
      >
        {/* 4 Corner Yards */}
        {renderYardBase('red', 1, 1)}
        {renderYardBase('green', 1, 10)}
        {renderYardBase('yellow', 10, 10)}
        {renderYardBase('blue', 10, 1)}

        {/* Center Home Triangle */}
        {renderCenterHome()}

        {/* 15x15 Track & Home-Stretch Cells */}
        {Array.from({ length: 15 }).map((_, r) =>
          Array.from({ length: 15 }).map((__, c) => renderCell(r, c))
        )}

        {/* Render Floating Pawns/Tokens */}
        {tokensOnBoard.map(({ token, coord, player, isValid }) => (
          <TokenPiece
            key={`token-${player.color}-${token.id}`}
            token={token}
            playerColor={player.color}
            playerName={player.name}
            coord={coord}
            isValidMove={isValid && Boolean(isMyTurn)}
            isDragged={draggedTokenId === token.id}
            isHovered={hoveredTokenId === token.id}
            onDragStart={() => setDraggedTokenId(token.id)}
            onDragEnd={() => setDraggedTokenId(null)}
            onHover={() => setHoveredTokenId(token.id)}
            onHoverEnd={() => setHoveredTokenId(null)}
            onClick={() => {
              if (isValid && isMyTurn) {
                onMoveToken(token.id);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};
