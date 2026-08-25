import React from 'react';
import { Player, PlayerColor } from '../types';
import { COLOR_CONFIG } from '../utils/boardCoordinates';
import { Bot, Wifi, WifiOff, Trophy, Crown } from 'lucide-react';

interface PlayerCardProps {
  player?: Player;
  color: PlayerColor;
  isActive: boolean;
  isMe: boolean;
  timeRemaining: number;
  timeLimit: number;
  onSelectSlot?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  color,
  isActive,
  isMe,
  timeRemaining,
  timeLimit,
}) => {
  const config = (color && COLOR_CONFIG[color]) || COLOR_CONFIG.red;

  if (!player) {
    return (
      <div
        className="p-3 rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/30 flex items-center justify-center min-h-[76px]"
      >
        <span className="text-xs text-slate-500 font-medium">Empty Slot ({config.name})</span>
      </div>
    );
  }

  // Count tokens in yard, track, home
  const yardCount = player.tokens.filter((t) => t.state === 'YARD').length;
  const homeCount = player.tokens.filter((t) => t.state === 'HOME').length;
  const trackCount = 4 - yardCount - homeCount;

  // Timer percentage
  const timerPercent = timeLimit > 0 ? (timeRemaining / timeLimit) * 100 : 100;

  return (
    <div
      id={`player-card-${color}`}
      className={`relative p-2.5 sm:p-3 rounded-2xl transition-all duration-300 backdrop-blur-md ${
        isActive
          ? 'bg-slate-800/90 border-2 shadow-lg shadow-black/40 scale-[1.02]'
          : 'bg-slate-900/60 border border-slate-800/70 opacity-85'
      }`}
      style={{
        borderColor: isActive ? config.accentHex : undefined,
      }}
    >
      {/* Active turn indicator glow */}
      {isActive && (
        <div
          className="absolute -inset-0.5 rounded-2xl blur-sm opacity-50 -z-10 animate-pulse"
          style={{ backgroundColor: config.accentHex }}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        {/* Left: Avatar & Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            {/* Avatar circle */}
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl shadow-md border-2 border-white/20"
              style={{ backgroundColor: config.accentHex }}
            >
              {player.avatar}
            </div>

            {/* Rank badge if won */}
            {player.hasWon && player.rank && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md border border-amber-200">
                #{player.rank}
              </div>
            )}

            {/* Online / Bot indicator */}
            <div className="absolute -bottom-1 -right-1 bg-slate-950 rounded-full p-0.5">
              {player.type === 'bot' ? (
                <Bot className="w-3.5 h-3.5 text-sky-400" />
              ) : player.isConnected ? (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[90px] sm:max-w-[120px]">
                {player.name}
              </span>
              {isMe && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-indigo-500/30 text-indigo-300 rounded border border-indigo-400/30">
                  YOU
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="capitalize font-medium" style={{ color: config.accentHex }}>
                {config.name}
              </span>
              {player.type === 'bot' && (
                <span className="text-[10px] text-slate-500">({player.botDifficulty || 'Bot'})</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Progress & Timer */}
        <div className="flex flex-col items-end gap-1">
          {/* Tokens Home Progress */}
          <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800/80">
            <Crown className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">{homeCount}/4</span>
          </div>

          {/* Turn timer countdown */}
          {isActive && timeLimit > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <div
                className={`w-2 h-2 rounded-full ${
                  timeRemaining <= 5 ? 'bg-rose-500 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span className={timeRemaining <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}>
                {timeRemaining}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mini Token Distribution Bar */}
      <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-medium text-slate-400 bg-slate-950/40 p-1 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-center gap-1">
          <span className="text-slate-500">Yard:</span>
          <span className="text-slate-200 font-bold">{yardCount}</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-slate-500">Track:</span>
          <span className="text-sky-400 font-bold">{trackCount}</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-slate-500">Home:</span>
          <span className="text-emerald-400 font-bold">{homeCount}</span>
        </div>
      </div>
    </div>
  );
};
