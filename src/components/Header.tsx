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
  Home,
  Users,
  Wifi,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  gameState: GameState;
  theme: BoardTheme;
  setTheme: (t: BoardTheme) => void;
  soundMuted: boolean;
  setSoundMuted: (m: boolean) => void;
  onOpenRules: () => void;
  onToggleChat: () => void;
  onOpenLobby: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gameState,
  theme,
  setTheme,
  soundMuted,
  setSoundMuted,
  onOpenRules,
  onToggleChat,
  onOpenLobby,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (gameState.roomId) {
      navigator.clipboard.writeText(gameState.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 select-none z-30">
      {/* Brand & Mode */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenLobby}
          className="flex items-center gap-2 hover:opacity-90 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-sm font-black text-amber-400">
              🎲
            </div>
          </div>
          <div className="text-left hidden xs:block">
            <h1 className="text-xs sm:text-sm font-black text-white leading-tight">
              Ludo Royale
            </h1>
            <span className="text-[10px] text-slate-400 font-medium">
              {gameState.mode === 'online_multiplayer'
                ? 'Online Room'
                : gameState.mode === 'local_vs_bot'
                ? 'Vs AI Bots'
                : 'Pass & Play'}
            </span>
          </div>
        </button>

        {/* Room Code Badge (Online Mode) */}
        {gameState.mode === 'online_multiplayer' && gameState.roomId && (
          <div className="flex items-center gap-1.5 bg-sky-950/80 border border-sky-600/40 px-2.5 py-1 rounded-xl text-xs">
            <span className="text-slate-400 text-[10px] font-bold">CODE:</span>
            <span className="font-mono font-black text-sky-300 tracking-wider">
              {gameState.roomId}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copy Room Code"
              className="p-0.5 hover:text-white text-sky-400 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Theme Picker */}
        <div className="relative group">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as BoardTheme)}
            className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none cursor-pointer pr-6"
          >
            <option value="classic_wood">Classic Wood</option>
            <option value="modern_neon">Modern Neon</option>
            <option value="vibrant_carnival">Carnival</option>
            <option value="nordic_minimal">Minimal</option>
          </select>
          <Palette className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundMuted(!soundMuted)}
          className={`p-2 rounded-xl text-xs transition border ${
            soundMuted
              ? 'bg-slate-800 text-slate-500 border-slate-700'
              : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
          }`}
          title={soundMuted ? 'Unmute SFX' : 'Mute SFX'}
        >
          {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Rules Guide */}
        <button
          onClick={onOpenRules}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Game Rules"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Chat Toggle */}
        <button
          onClick={onToggleChat}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition relative"
          title="Match Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Lobby / Menu */}
        <button
          onClick={onOpenLobby}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lobby</span>
        </button>
      </div>
    </header>
  );
};
