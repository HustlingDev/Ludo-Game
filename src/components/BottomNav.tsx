import React from 'react';
import { Gamepad2, Users, Trophy, BarChart3, History, Sliders, Bell } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BottomNavProps {
  activeModal: string | null;
  pendingRequestsCount: number;
  unreadNotificationsCount: number;
  onOpenLobby: () => void;
  onOpenFriends: () => void;
  onOpenLeaderboard: () => void;
  onOpenStats: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeModal,
  pendingRequestsCount,
  unreadNotificationsCount,
  onOpenLobby,
  onOpenFriends,
  onOpenLeaderboard,
  onOpenStats,
  onOpenHistory,
  onOpenSettings,
  onOpenNotifications,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1.5 flex items-center justify-around safe-area-bottom shadow-2xl">
      {/* Play / Game */}
      <button
        onClick={() => {
          sounds.playButton();
          onOpenLobby();
        }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
          activeModal === 'lobby' || activeModal === null
            ? 'text-sky-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Gamepad2 className="w-5 h-5" />
        <span className="text-[10px]">Play</span>
      </button>

      {/* Friends */}
      <button
        onClick={() => {
          sounds.playButton();
          onOpenFriends();
        }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl relative transition ${
          activeModal === 'friends' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px]">Friends</span>
        {pendingRequestsCount > 0 && (
          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] text-white font-bold absolute top-0.5 right-1.5 flex items-center justify-center">
            {pendingRequestsCount}
          </span>
        )}
      </button>

      {/* Leaderboard */}
      <button
        onClick={() => {
          sounds.playButton();
          onOpenLeaderboard();
        }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
          activeModal === 'leaderboard'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Trophy className="w-5 h-5" />
        <span className="text-[10px]">Rank</span>
      </button>

      {/* Stats */}
      <button
        onClick={() => {
          sounds.playButton();
          onOpenStats();
        }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
          activeModal === 'stats' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-[10px]">Stats</span>
      </button>

      {/* History */}
      <button
        onClick={() => {
          sounds.playButton();
          onOpenHistory();
        }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
          activeModal === 'history' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px]">History</span>
      </button>

      {/* Settings */}
      <button
        onClick={() => {
          sounds.playButton();
          onOpenSettings();
        }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
          activeModal === 'settings' ? 'text-slate-200 font-bold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Sliders className="w-5 h-5" />
        <span className="text-[10px]">Settings</span>
      </button>
    </nav>
  );
};
