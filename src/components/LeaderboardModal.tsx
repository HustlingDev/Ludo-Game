import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';
import {
  X,
  Trophy,
  Crown,
  Medal,
  TrendingUp,
  Flame,
  Award,
  Zap,
  Sparkles,
  Users,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  currentUserRating: number;
  currentUserName: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentUserRating,
  currentUserName,
}) => {
  const [filterMetric, setFilterMetric] = useState<'rating' | 'wins' | 'winRate' | 'xp'>('rating');
  const [timeframe, setTimeframe] = useState<'all_time' | 'weekly'>('all_time');

  if (!isOpen) return null;

  const sortedEntries = [...entries].sort((a, b) => {
    if (filterMetric === 'rating') return b.rating - a.rating;
    if (filterMetric === 'wins') return b.wins - a.wins;
    if (filterMetric === 'winRate') return b.winRate - a.winRate;
    return b.xp - a.xp;
  });

  const currentUserRank =
    sortedEntries.findIndex((e) => e.isCurrentUser || e.name === currentUserName) + 1;

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border border-amber-300">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-xl bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border border-white">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-xl bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-lg border border-amber-600">
          🥉
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-700">
        #{rank}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Global Leaderboard
              </h3>
              <p className="text-[11px] text-slate-400">Competitive rankings & player leaderboards</p>
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

        {/* Timeframe & Metric Selector */}
        <div className="py-3 space-y-2 border-b border-slate-800">
          {/* Timeframe toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => {
                sounds.playButton();
                setTimeframe('all_time');
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                timeframe === 'all_time' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => {
                sounds.playButton();
                setTimeframe('weekly');
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                timeframe === 'weekly' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly Season
            </button>
          </div>

          {/* Metric tabs */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold pt-1">
            {[
              { id: 'rating', label: 'ELO Rating' },
              { id: 'wins', label: 'Total Wins' },
              { id: 'winRate', label: 'Win Rate %' },
              { id: 'xp', label: 'Player XP' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playButton();
                  setFilterMetric(tab.id as typeof filterMetric);
                }}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                  filterMetric === tab.id
                    ? 'bg-slate-800 border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium (Visual Showcase) */}
        {sortedEntries.length >= 3 && (
          <div className="py-3 px-2 grid grid-cols-3 gap-2 text-center items-end border-b border-slate-800/80">
            {/* Rank 2 */}
            <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-700 flex flex-col items-center">
              <div className="text-xl">{sortedEntries[1].avatar}</div>
              <div className="font-bold text-xs text-white truncate max-w-full mt-1">
                {sortedEntries[1].name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                ⭐ {sortedEntries[1].rating}
              </div>
              <div className="mt-1.5 px-2 py-0.5 rounded bg-slate-300 text-slate-950 font-black text-[10px]">
                #2 Silver
              </div>
            </div>

            {/* Rank 1 (Tallest) */}
            <div className="p-3 rounded-2xl bg-amber-950/40 border-2 border-amber-400 flex flex-col items-center shadow-lg relative -top-1">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400 mb-1" />
              <div className="text-2xl">{sortedEntries[0].avatar}</div>
              <div className="font-bold text-xs text-white truncate max-w-full mt-1">
                {sortedEntries[0].name}
              </div>
              <div className="text-[10px] text-amber-300 font-mono font-bold mt-0.5">
                ⭐ {sortedEntries[0].rating}
              </div>
              <div className="mt-1.5 px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] shadow">
                #1 Champion
              </div>
            </div>

            {/* Rank 3 */}
            <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-700 flex flex-col items-center">
              <div className="text-xl">{sortedEntries[2].avatar}</div>
              <div className="font-bold text-xs text-white truncate max-w-full mt-1">
                {sortedEntries[2].name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                ⭐ {sortedEntries[2].rating}
              </div>
              <div className="mt-1.5 px-2 py-0.5 rounded bg-amber-700 text-white font-black text-[10px]">
                #3 Bronze
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Leaderboard List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {sortedEntries.map((entry, idx) => {
            const rank = idx + 1;
            const isUser = entry.isCurrentUser || entry.name === currentUserName;

            return (
              <div
                key={entry.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                  isUser
                    ? 'bg-amber-950/30 border-amber-500/50 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(rank)}

                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shrink-0">
                    {entry.avatar}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                      <span>{entry.name}</span>
                      {isUser && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{entry.wins} Wins</span>
                      <span>•</span>
                      <span>{entry.winRate}% Winrate</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-xs sm:text-sm text-amber-400">
                    {filterMetric === 'rating' && `⭐ ${entry.rating}`}
                    {filterMetric === 'wins' && `🏆 ${entry.wins}`}
                    {filterMetric === 'winRate' && `${entry.winRate}%`}
                    {filterMetric === 'xp' && `⚡ ${entry.xp} XP`}
                  </div>
                  <div className="text-[10px] text-slate-500">{entry.gamesPlayed} Matches</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current User Sticky Rank Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/90 p-3 rounded-2xl border border-amber-500/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Your Current Rank:</span>
            <span className="font-black text-amber-400 text-sm font-mono">
              #{currentUserRank > 0 ? currentUserRank : 'Unranked'}
            </span>
          </div>
          <div className="text-xs font-mono font-bold text-white">
            ⭐ {currentUserRating} ELO
          </div>
        </div>
      </div>
    </div>
  );
};
