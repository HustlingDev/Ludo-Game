import React from 'react';
import { PlayerStats } from '../types';
import {
  X,
  Trophy,
  Award,
  Swords,
  TrendingUp,
  Flame,
  Zap,
  Target,
  BarChart3,
  Shield,
  Star,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  userName: string;
  avatar: string;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  userName,
  avatar,
}) => {
  if (!isOpen) return null;

  const xpPercent = Math.min(
    100,
    Math.round((stats.currentXp / Math.max(1, stats.nextLevelXp)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Player Statistics & Record
              </h3>
              <p className="text-[11px] text-slate-400">Career performance, ELO rating & XP metrics</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playButton();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs sm:text-sm">
          {/* Level & XP Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-sky-500/10 to-indigo-500/20 border border-amber-500/30 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 border-2 border-amber-400/80 flex items-center justify-center text-3xl shrink-0 shadow-lg">
              {avatar}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-sm sm:text-base truncate">
                  {userName}
                </span>
                <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-500/40">
                  Level {stats.currentLevel}
                </span>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>XP Progress</span>
                  <span>
                    {stats.currentXp} / {stats.nextLevelXp} ({xpPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rating Cards Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
                <span>Current ELO</span>
                <Trophy className="w-4 h-4" />
              </div>
              <div className="mt-2 font-mono font-black text-2xl text-white">
                {stats.currentRating}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Peak: {stats.highestRating} pts</div>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
                <span>Win Rate</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="mt-2 font-mono font-black text-2xl text-white">
                {stats.winRate}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {stats.wins}W / {stats.losses}L
              </div>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Matches</div>
              <div className="font-mono font-black text-lg text-white mt-1">
                {stats.totalGames}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
              <div className="text-[10px] text-rose-400 uppercase font-bold flex items-center justify-center gap-1">
                <Swords className="w-3 h-3" />
                <span>Captures</span>
              </div>
              <div className="font-mono font-black text-lg text-white mt-1">
                {stats.totalCaptures}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Abandoned</div>
              <div className="font-mono font-black text-lg text-slate-300 mt-1">
                {stats.gamesAbandoned}
              </div>
            </div>
          </div>

          {/* Recent Form Badge Streak */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Recent Match Streak
              </span>
              <span className="text-[10px] text-slate-400">Last 5 Matches</span>
            </div>

            <div className="flex items-center gap-2">
              {stats.recentForm.length === 0 ? (
                <span className="text-slate-500 text-xs">No recent match data</span>
              ) : (
                stats.recentForm.map((result, idx) => (
                  <div
                    key={idx}
                    className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shadow-md ${
                      result === 'W'
                        ? 'bg-emerald-500 text-white border border-emerald-400'
                        : 'bg-rose-500/30 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Favorite Mode Card */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Favorite Mode</div>
                <div className="text-xs font-bold text-white mt-0.5 capitalize">
                  {stats.favoriteGameMode.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-bold border border-sky-500/30">
              Verified Player
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sounds.playButton();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
