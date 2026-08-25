import React, { useState } from 'react';
import { MatchHistoryItem, PlayerColor } from '../types';
import { COLOR_CONFIG } from '../utils/boardCoordinates';
import {
  X,
  History,
  Trophy,
  Calendar,
  Clock,
  Swords,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Shield,
  Award,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: MatchHistoryItem[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history }) => {
  const [selectedMatch, setSelectedMatch] = useState<MatchHistoryItem | null>(null);

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Match History
              </h3>
              <p className="text-[11px] text-slate-400">Completed multiplayer & local match logs</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playButton();
              if (selectedMatch) {
                setSelectedMatch(null);
              } else {
                onClose();
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Match Details View */}
        {selectedMatch ? (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs sm:text-sm">
            <button
              onClick={() => {
                sounds.playButton();
                setSelectedMatch(null);
              }}
              className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
            >
              ← Back to History List
            </button>

            {/* Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                selectedMatch.result === 'VICTORY'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/20 flex items-center justify-center text-2xl shadow">
                  {selectedMatch.result === 'VICTORY' ? '🏆' : '⚔️'}
                </div>
                <div>
                  <div className="font-black text-base text-white">{selectedMatch.result}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{selectedMatch.date}</span>
                    <span>•</span>
                    <span>{formatDuration(selectedMatch.durationSeconds)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`font-mono font-black text-sm flex items-center gap-1 justify-end ${
                    selectedMatch.ratingChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedMatch.ratingChange >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {selectedMatch.ratingChange >= 0 ? '+' : ''}
                    {selectedMatch.ratingChange} ELO
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                  {selectedMatch.gameMode.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            {/* Players in Match */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Final Standings
              </span>

              <div className="space-y-1.5">
                {selectedMatch.players
                  .sort((a, b) => a.rank - b.rank)
                  .map((p, idx) => {
                    const cfg = COLOR_CONFIG[p.color] || COLOR_CONFIG.red;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border flex items-center justify-between ${
                          p.isWinner
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-slate-400 w-4">
                            #{p.rank}
                          </span>
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border border-white/20"
                            style={{ backgroundColor: cfg.accentHex }}
                          >
                            {p.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.isUser && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-sky-500/20 text-sky-300 rounded font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ⭐ {p.rating} ELO
                            </div>
                          </div>
                        </div>

                        {p.isWinner && (
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Winner</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          /* Match List */
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {history.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <History className="w-10 h-10 opacity-30" />
                <p className="text-xs">No match history recorded yet.</p>
                <p className="text-[11px] text-slate-600">
                  Play matches to track scores, ELO ratings & battle logs.
                </p>
              </div>
            ) : (
              history.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    sounds.playButton();
                    setSelectedMatch(m);
                  }}
                  className="p-3.5 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border shrink-0 ${
                        m.result === 'VICTORY'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {m.result === 'VICTORY' ? '👑' : '⚔️'}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                        <span>{m.result}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            m.ratingChange >= 0
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {m.ratingChange >= 0 ? '+' : ''}
                          {m.ratingChange}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{m.date}</span>
                        <span>•</span>
                        <span className="capitalize">{m.gameMode.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatDuration(m.durationSeconds)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {m.players.length} Players
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
