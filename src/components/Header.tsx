import React, { useState } from 'react';
import { GameState, BoardTheme } from '../types';
import {
  Volume2,
  VolumeX,
  BookOpen,
  MessageSquare,
  Copy,
  Check,
  Palette,
  Users,
  Trophy,
  BarChart3,
  History,
  Sliders,
  Bell,
  Sparkles,
  Wallet,
  User,
  Shield,
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  gameState: GameState;
  theme: BoardTheme;
  setTheme: (t: BoardTheme) => void;
  soundMuted: boolean;
  setSoundMuted: (m: boolean) => void;
  userRating: number;
  userName: string;
  pendingRequestsCount: number;
  unreadNotificationsCount: number;
  onOpenRules: () => void;
  onToggleChat: () => void;
  onOpenLobby: () => void;
  onOpenFriends: () => void;
  onOpenLeaderboard: () => void;
  onOpenStats: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenWallet?: () => void;
  onOpenAuth?: () => void;
  onOpenAdmin?: () => void;
  onExitToLobby?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gameState,
  theme,
  setTheme,
  soundMuted,
  setSoundMuted,
  userRating,
  userName,
  pendingRequestsCount,
  unreadNotificationsCount,
  onOpenRules,
  onToggleChat,
  onOpenLobby,
  onOpenFriends,
  onOpenLeaderboard,
  onOpenStats,
  onOpenHistory,
  onOpenSettings,
  onOpenNotifications,
  onOpenWallet,
  onOpenAuth,
  onOpenAdmin,
  onExitToLobby,
}) => {
  const [copied, setCopied] = useState(false);
  const { user, wallet, userProfile } = useAuth();

  const isInGame = gameState.status === 'playing' || gameState.status === 'paused';

  const handleCopyCode = () => {
    if (gameState.roomId) {
      navigator.clipboard.writeText(gameState.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-5 py-2 flex items-center justify-between gap-2 select-none z-30">
      {/* Brand & Mode */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => {
            sounds.playButton();
            if (isInGame && onExitToLobby) {
              onExitToLobby();
            } else {
              onOpenLobby();
            }
          }}
          className="flex items-center gap-2 hover:opacity-90 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-sm font-black text-amber-400">
              🎲
            </div>
          </div>
          <div className="text-left hidden xs:block">
            <h1 className="text-xs sm:text-sm font-black text-white leading-tight flex items-center gap-1.5">
              <span>Ludo Royale</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-medium">
              {gameState.status === 'lobby'
                ? 'Main Lobby'
                : gameState.mode === 'online_multiplayer'
                ? 'Online Room'
                : gameState.mode === 'local_vs_bot'
                ? 'Vs AI Bots'
                : 'Pass & Play'}
            </span>
          </div>
        </button>

        {/* Exit to Lobby quick button during matches */}
        {isInGame && onExitToLobby && (
          <button
            onClick={() => {
              sounds.playButton();
              onExitToLobby();
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-bold transition"
            title="Return to Lobby"
          >
            🏠 Exit Match
          </button>
        )}

        {/* User ELO Rating Pill */}
        <button
          onClick={() => {
            sounds.playButton();
            onOpenStats();
          }}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/40 hover:bg-amber-900/40 transition text-xs"
        >
          <span className="text-[11px] text-slate-300 font-bold">{userName}</span>
          <span className="font-mono font-black text-amber-400">⭐ {userRating}</span>
        </button>

        {/* Room Code Badge (Online Mode) */}
        {gameState.mode === 'online_multiplayer' && gameState.roomId && (
          <div className="flex items-center gap-1.5 bg-sky-950/80 border border-sky-600/40 px-2 sm:px-2.5 py-1 rounded-xl text-xs">
            <span className="text-slate-400 text-[10px] font-bold">CODE:</span>
            <span className="font-mono font-black text-sky-300 tracking-wider">
              {gameState.roomId}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copy Room Code"
              className="p-0.5 hover:text-white text-sky-400 transition"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* UGX Wallet Button */}
        <button
          onClick={() => {
            sounds.playButton();
            onOpenWallet?.();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/40 transition shadow-sm"
          title="UGX Wallet & Deposits"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span className="text-xs font-black">
            UGX {(wallet?.availableBalance || 0).toLocaleString()}
          </span>
        </button>

        {/* User Account / Sign In */}
        <button
          onClick={() => {
            sounds.playButton();
            onOpenAuth?.();
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition"
          title={user ? 'User Profile' : 'Sign In / Register'}
        >
          <User className="w-4 h-4" />
        </button>

        {/* Template Selector */}
        <div className="relative group hidden sm:block">
          <select
            value={theme}
            onChange={(e) => {
              sounds.playButton();
              setTheme(e.target.value as BoardTheme);
            }}
            className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none cursor-pointer pr-6"
          >
            <option value="classic_arrows">Classic Arrows</option>
            <option value="star_minimal">Star Minimal</option>
            <option value="geometric_diamond">Retro Diamond</option>
            <option value="classic_wood">Classic Wood</option>
            <option value="modern_neon">Modern Neon</option>
          </select>
          <Palette className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Friends */}
        <button
          onClick={() => {
            sounds.playButton();
            onOpenFriends();
          }}
          className="hidden sm:flex p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition relative"
          title="Friends & Social"
        >
          <Users className="w-4 h-4" />
          {pendingRequestsCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1 right-1" />
          )}
        </button>

        {/* Leaderboard */}
        <button
          onClick={() => {
            sounds.playButton();
            onOpenLeaderboard();
          }}
          className="hidden sm:flex p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
          title="Leaderboard"
        >
          <Trophy className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => {
            sounds.playButton();
            onOpenNotifications();
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 absolute top-1 right-1 animate-ping" />
          )}
        </button>

        {/* Chat Toggle */}
        <button
          onClick={() => {
            sounds.playButton();
            onToggleChat();
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition relative"
          title="Match Chat & Reactions"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Rules Guide */}
        <button
          onClick={() => {
            sounds.playButton();
            onOpenRules();
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Game Rules"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Admin Console */}
        {onOpenAdmin && (
          <button
            onClick={() => {
              sounds.playButton();
              onOpenAdmin();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
            title="Admin Dashboard"
          >
            <Shield className="w-4 h-4" />
          </button>
        )}

        {/* Settings */}
        <button
          onClick={() => {
            sounds.playButton();
            onOpenSettings();
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          title="Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
