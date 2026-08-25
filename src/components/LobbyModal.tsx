import React, { useState, useEffect } from 'react';
import { PlayerColor, BoardTheme } from '../types';
import { UserProfile } from '../hooks/useLudoGame';
import { COLOR_CONFIG } from '../utils/boardCoordinates';
import {
  Users,
  Globe,
  Bot,
  Play,
  Copy,
  Check,
  Sparkles,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface LobbyModalProps {
  isOpen: boolean;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  theme: BoardTheme;
  setTheme: (t: BoardTheme) => void;
  onClose: () => void;
  onStartLocalGame: (
    mode: 'local_pass_play' | 'local_vs_bot',
    configs: {
      name: string;
      avatar: string;
      color: PlayerColor;
      type: 'human' | 'bot';
      botDifficulty?: 'easy' | 'medium' | 'hard';
    }[]
  ) => void;
  onCreateOnlineRoom: (
    hostName: string,
    avatar: string,
    color: PlayerColor,
    turnTimeLimit: number,
    withBots: boolean
  ) => void;
  onJoinOnlineRoom: (
    roomId: string,
    playerName: string,
    avatar: string,
    color?: PlayerColor
  ) => void;
}

const AVATARS = ['👑', '⚡', '🐉', '🦁', '🚀', '🎯', '🔥', '💎', '🦊', '🐼', '🤖', '🎲'];
const ALL_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const LobbyModal: React.FC<LobbyModalProps> = ({
  isOpen,
  profile,
  setProfile,
  theme,
  setTheme,
  onClose,
  onStartLocalGame,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'online' | 'pass_play' | 'vs_bots'>('online');
  const [joinCode, setJoinCode] = useState('');
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [withBots, setWithBots] = useState<boolean>(true);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [localPlayerCount, setLocalPlayerCount] = useState<number>(4);
  const [localPlayerNames, setLocalPlayerNames] = useState<string[]>([
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
  ]);
  const [publicRooms, setPublicRooms] = useState<
    { roomId: string; playerCount: number; hostName: string }[]
  >([]);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch public rooms
  useEffect(() => {
    if (activeTab === 'online') {
      fetch('/api/rooms/public')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.rooms) {
            setPublicRooms(data.rooms);
          }
        })
        .catch(() => {});
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const handleStartVsBots = (playerCount: number) => {
    const chosenColors = ALL_COLORS.slice(0, playerCount);
    const configs = chosenColors.map((color, idx) => {
      if (color === profile.preferredColor || idx === 0) {
        return {
          name: profile.name,
          avatar: profile.avatar,
          color,
          type: 'human' as const,
        };
      }
      const botNames = ['CyberBot', 'RoboPro', 'StarAI', 'LudoMaster'];
      const botAvatars = ['🤖', '⚡', '🛸', '👾'];
      return {
        name: botNames[idx] || `Bot ${color.toUpperCase()}`,
        avatar: botAvatars[idx] || '🤖',
        color,
        type: 'bot' as const,
        botDifficulty,
      };
    });

    onStartLocalGame('local_vs_bot', configs);
  };

  const handleStartPassAndPlay = () => {
    const chosenColors = ALL_COLORS.slice(0, localPlayerCount);
    const configs = chosenColors.map((color, idx) => ({
      name: localPlayerNames[idx] || `Player ${idx + 1}`,
      avatar: AVATARS[idx % AVATARS.length],
      color,
      type: 'human' as const,
    }));

    onStartLocalGame('local_pass_play', configs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header Title */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500 p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-xl">
                🎲
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                Ludo Royale
              </h2>
              <p className="text-xs text-slate-400">
                Real-Time Multiplayer & AI Board Game
              </p>
            </div>
          </div>

          {/* Theme Quick Toggle */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 font-medium mr-1">Theme:</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as BoardTheme)}
              className="bg-transparent text-xs font-bold text-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="classic_wood" className="bg-slate-900 text-white">Classic Wood</option>
              <option value="modern_neon" className="bg-slate-900 text-white">Modern Neon</option>
              <option value="vibrant_carnival" className="bg-slate-900 text-white">Carnival</option>
              <option value="nordic_minimal" className="bg-slate-900 text-white">Nordic Minimal</option>
            </select>
          </div>
        </div>

        {/* Profile Bar */}
        <div className="my-4 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative group">
              <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center text-2xl border-2 border-amber-400/40">
                {profile.avatar}
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400">
                Your Nickname
              </label>
              <input
                type="text"
                value={profile.name}
                maxLength={16}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="bg-transparent font-bold text-sm text-white focus:outline-none focus:border-b border-amber-400"
              />
            </div>
          </div>

          {/* Avatar & Color Pickers */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {['👑', '⚡', '🚀', '🔥', '🦁', '🐉'].map((av) => (
                <button
                  key={av}
                  onClick={() => setProfile({ ...profile, avatar: av })}
                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                    profile.avatar === av
                      ? 'bg-amber-400/30 border border-amber-400 scale-110'
                      : 'hover:bg-slate-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
              {ALL_COLORS.map((c) => {
                const conf = COLOR_CONFIG[c];
                return (
                  <button
                    key={c}
                    onClick={() => setProfile({ ...profile, preferredColor: c })}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      profile.preferredColor === c
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: conf.accentHex }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('online')}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'online'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Online Match</span>
          </button>

          <button
            onClick={() => setActiveTab('vs_bots')}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'vs_bots'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Vs AI Bots</span>
          </button>

          <button
            onClick={() => setActiveTab('pass_play')}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'pass_play'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pass & Play</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'online' && (
            <div className="space-y-4">
              {/* Create Room Box */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">Host New Room</span>
                  <span className="text-[11px] text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-800/40">
                    Live WebSockets
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Turn Timer</label>
                    <select
                      value={turnTimer}
                      onChange={(e) => setTurnTimer(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 font-bold text-white focus:outline-none"
                    >
                      <option value={15}>⚡ 15 Seconds (Blitz)</option>
                      <option value={30}>⏱️ 30 Seconds (Standard)</option>
                      <option value={60}>⌛ 60 Seconds (Relaxed)</option>
                      <option value={0}>♾️ No Time Limit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Fill Empty with Bots</label>
                    <div className="flex items-center h-[38px] bg-slate-900 border border-slate-700 rounded-xl px-3">
                      <input
                        type="checkbox"
                        id="with-bots-checkbox"
                        checked={withBots}
                        onChange={(e) => setWithBots(e.target.checked)}
                        className="w-4 h-4 text-sky-500 rounded focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="with-bots-checkbox" className="ml-2 text-xs font-semibold cursor-pointer">
                        {withBots ? 'Yes (Auto Bots)' : 'No (Humans Only)'}
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  id="create-online-room-btn"
                  onClick={() =>
                    onCreateOnlineRoom(
                      profile.name,
                      profile.avatar,
                      profile.preferredColor,
                      turnTimer,
                      withBots
                    )
                  }
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-sky-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create Room & Invite Friends</span>
                </button>
              </div>

              {/* Join with Code */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="ENTER 6-CHAR ROOM CODE"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono font-bold text-sm tracking-widest text-white uppercase focus:outline-none focus:border-sky-500"
                />
                <button
                  disabled={joinCode.length < 4}
                  onClick={() =>
                    onJoinOnlineRoom(
                      joinCode,
                      profile.name,
                      profile.avatar,
                      profile.preferredColor
                    )
                  }
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    joinCode.length >= 4
                      ? 'bg-sky-500 text-white hover:bg-sky-400 active:scale-95 shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Join
                </button>
              </div>

              {/* Public Rooms */}
              {publicRooms.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Available Public Rooms
                  </span>
                  <div className="space-y-1.5">
                    {publicRooms.map((r) => (
                      <div
                        key={r.roomId}
                        className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-white">Room: {r.roomId}</div>
                          <div className="text-[11px] text-slate-400">Host: {r.hostName}</div>
                        </div>
                        <button
                          onClick={() =>
                            onJoinOnlineRoom(
                              r.roomId,
                              profile.name,
                              profile.avatar,
                              profile.preferredColor
                            )
                          }
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow"
                        >
                          Join ({r.playerCount}/4)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vs_bots' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                <span className="font-bold text-sm text-slate-200">Bot Difficulty</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setBotDifficulty(diff)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        botDifficulty === diff
                          ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {diff === 'easy' ? '🌱 Casual' : diff === 'medium' ? '⚔️ Tactical' : '🔥 Master'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStartVsBots(2)}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-emerald-500 text-left transition-all hover:scale-[1.02] group"
                >
                  <div className="text-xl mb-1">⚔️</div>
                  <div className="font-bold text-sm text-white group-hover:text-emerald-300">
                    2 Players (1v1)
                  </div>
                  <div className="text-xs text-slate-400">You vs 1 Smart Bot</div>
                </button>

                <button
                  onClick={() => handleStartVsBots(4)}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-emerald-500 text-left transition-all hover:scale-[1.02] group"
                >
                  <div className="text-xl mb-1">👑</div>
                  <div className="font-bold text-sm text-white group-hover:text-emerald-300">
                    4 Players (Battle Royale)
                  </div>
                  <div className="text-xs text-slate-400">You vs 3 AI Bots</div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pass_play' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">Number of Players</span>
                  <div className="flex gap-1.5">
                    {[2, 3, 4].map((count) => (
                      <button
                        key={count}
                        onClick={() => setLocalPlayerCount(count)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                          localPlayerCount === count
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-700/60">
                  {Array.from({ length: localPlayerCount }).map((_, idx) => {
                    const col = ALL_COLORS[idx];
                    const cfg = COLOR_CONFIG[col];
                    return (
                      <div
                        key={`local-p-${idx}`}
                        className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-700/40"
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: cfg.accentHex }}
                        />
                        <input
                          type="text"
                          value={localPlayerNames[idx] || `Player ${idx + 1}`}
                          onChange={(e) => {
                            const newNames = [...localPlayerNames];
                            newNames[idx] = e.target.value;
                            setLocalPlayerNames(newNames);
                          }}
                          className="flex-1 bg-transparent text-xs font-bold text-white focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleStartPassAndPlay}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Pass & Play</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
