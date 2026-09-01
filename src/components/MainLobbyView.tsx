import React, { useState, useEffect } from 'react';
import {
  Users,
  Globe,
  Bot,
  Play,
  Copy,
  Check,
  Sparkles,
  Zap,
  Trophy,
  CreditCard,
  Flame,
  ArrowRight,
  TrendingUp,
  Award,
  Crown,
  HelpCircle,
  Settings,
  PlusCircle,
  RefreshCw,
  Swords,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { PlayerColor, BoardTheme, GameMode } from '../types';
import { UserProfile } from '../hooks/useLudoGame';
import { COLOR_CONFIG } from '../utils/boardCoordinates';
import { ALLOWED_STAKES, calculatePrizePool } from '../types/platform';
import { getOppositeColor } from '../utils/ludoEngine';

interface MainLobbyViewProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  userRating: number;
  userBalanceUGX?: number;
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
  onOpenWallet: () => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  onOpenStats: () => void;
}

interface OnlinePlayer {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  status: 'available' | 'in_game';
  country?: string;
  isOnline?: boolean;
}

const AVATARS = ['👑', '⚡', '🐉', '🦁', '🚀', '🎯', '🔥', '💎', '🦊', '🐼', '🤖', '🎲'];
const ALL_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const MainLobbyView: React.FC<MainLobbyViewProps> = ({
  profile,
  setProfile,
  userRating,
  userBalanceUGX = 0,
  onStartLocalGame,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onOpenWallet,
  onOpenLeaderboard,
  onOpenRules,
  onOpenStats,
}) => {
  const [activeTab, setActiveTab] = useState<
    'quick_play' | 'online_players' | 'stakes' | 'online' | 'pass_play' | 'vs_bots'
  >('quick_play');
  const [joinCode, setJoinCode] = useState('');
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [withBots, setWithBots] = useState<boolean>(false);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [localPlayerCount, setLocalPlayerCount] = useState<number>(2);
  const [localPlayerNames, setLocalPlayerNames] = useState<string[]>([
    profile.name || 'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
  ]);
  const [selectedStake, setSelectedStake] = useState<number>(5000);
  const [stakePlayerCount, setStakePlayerCount] = useState<2 | 4>(2);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(false);
  const [challengingPlayer, setChallengingPlayer] = useState<OnlinePlayer | null>(null);
  const [challengeStake, setChallengeStake] = useState<number>(0);
  const [challengeSending, setChallengeSending] = useState(false);
  const [challengeSuccessMsg, setChallengeSuccessMsg] = useState<string | null>(null);

  // Poll online players and register heartbeat presence
  const fetchOnlinePlayers = async () => {
    setIsFetchingPlayers(true);
    try {
      // Send presence heartbeat
      await fetch('/api/lobby/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `usr_${profile.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: profile.name,
          avatar: profile.avatar,
          rating: userRating,
          status: 'available',
        }),
      });

      const res = await fetch('/api/lobby/players');
      const data = await res.json();
      if (data && data.players) {
        // Filter out self
        const others = data.players.filter((p: OnlinePlayer) => p.name !== profile.name);
        setOnlinePlayers(others);
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingPlayers(false);
    }
  };

  useEffect(() => {
    fetchOnlinePlayers();
    const interval = setInterval(fetchOnlinePlayers, 6000);
    return () => clearInterval(interval);
  }, [profile.name, userRating]);

  const handleStartPassAndPlay = (count: number) => {
    // When 2 players, choose opposite sides: e.g. Red (Top-Left) vs Yellow (Bottom-Right)
    const myColor = profile.preferredColor || 'red';
    const chosenColors =
      count === 2 ? [myColor, getOppositeColor(myColor)] : ALL_COLORS.slice(0, count);

    const configs = chosenColors.map((color, idx) => ({
      name: idx === 0 ? profile.name : localPlayerNames[idx] || `Player ${idx + 1}`,
      avatar: idx === 0 ? profile.avatar : AVATARS[idx % AVATARS.length],
      color,
      type: 'human' as const,
    }));

    onStartLocalGame('local_pass_play', configs);
  };

  const handleStartVsBots = (playerCount: number) => {
    const humanColor = profile.preferredColor || 'red';
    // 2-player match: player & bot on opposite sides!
    const chosenColors =
      playerCount === 2
        ? [humanColor, getOppositeColor(humanColor)]
        : ALL_COLORS.slice(0, playerCount);

    const configs = chosenColors.map((color, idx) => {
      if (color === humanColor || idx === 0) {
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

  // Direct 1v1 Challenge Action
  const handleSendChallenge = async () => {
    if (!challengingPlayer) return;
    setChallengeSending(true);
    try {
      const res = await fetch('/api/challenges/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPlayer: {
            id: `usr_${profile.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: profile.name,
            avatar: profile.avatar,
            rating: userRating,
            preferredColor: profile.preferredColor || 'red',
          },
          toPlayerId: challengingPlayer.id,
          stakeUGX: challengeStake,
        }),
      });

      const data = await res.json();
      if (data && data.success && data.roomId) {
        setChallengeSuccessMsg(data.message);
        setTimeout(() => {
          setChallengingPlayer(null);
          setChallengeSuccessMsg(null);
          // Launch into the created challenge match (opposite sides are guaranteed)
          const myColor = profile.preferredColor || 'red';
          const oppColor = getOppositeColor(myColor);
          onStartLocalGame('local_vs_bot', [
            {
              name: profile.name,
              avatar: profile.avatar,
              color: myColor,
              type: 'human',
            },
            {
              name: challengingPlayer.name,
              avatar: challengingPlayer.avatar,
              color: oppColor,
              type: 'bot',
              botDifficulty: 'hard',
            },
          ]);
        }, 1200);
      }
    } catch {
      setChallengeSending(false);
    }
  };

  const stakeQuote = calculatePrizePool(selectedStake, stakePlayerCount);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 animate-fadeIn">
      {/* Top Banner / Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <Crown className="w-3.5 h-3.5" />
              <span>Real-Time Multiplayer & Stakes Arena</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="text-amber-400">{profile.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Challenge online players directly, play on opposite sides with 3D dice rolls, or compete in UGX cash battles powered by PesaJet Mobile Money.
            </p>
          </div>

          {/* Player Quick Stats Badge */}
          <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl shrink-0 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-2xl shadow-lg border border-white/20">
                {profile.avatar}
              </div>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>{profile.name}</span>
                  <span className="text-[10px] font-black px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded">
                    PRO
                  </span>
                </div>
                <div className="text-xs text-amber-400 font-mono font-bold flex items-center gap-2">
                  <span>⭐ {userRating} ELO</span>
                  <span>•</span>
                  <span className="text-emerald-400">UGX {userBalanceUGX.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenWallet}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1 shrink-0"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Deposit</span>
            </button>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-bold text-xs">
        {[
          { id: 'quick_play', label: '1v1 / 4P Fast', icon: Play, color: 'text-emerald-400' },
          {
            id: 'online_players',
            label: `Online Duel (${onlinePlayers.length})`,
            icon: Swords,
            color: 'text-amber-400',
          },
          { id: 'stakes', label: 'Cash Stakes', icon: Flame, color: 'text-rose-400' },
          { id: 'online', label: 'Private Room', icon: Globe, color: 'text-sky-400' },
          { id: 'pass_play', label: 'Pass & Play', icon: Users, color: 'text-purple-400' },
          { id: 'vs_bots', label: 'VS AI Bots', icon: Bot, color: 'text-teal-400' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition ${
                isActive
                  ? 'bg-slate-900 border-amber-500 text-white shadow-xl ring-1 ring-amber-500/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${tab.color}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode Action Area */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md">
        {/* TAB 1: QUICK PLAY */}
        {activeTab === 'quick_play' && (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-black text-white">Choose Match Format</h3>
              <p className="text-xs text-slate-400">
                Opposite-side tactical positioning for 2 players. Standard official Ludo rules with 3-sixes allowed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* 2-Player Battle */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 transition flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-white">2-Player Fast Duel</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      Opposite Sides
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Head-to-head 1v1 battle positioned across opposite sides of the board (Red vs Yellow).
                  </p>
                </div>

                <button
                  onClick={() => handleStartPassAndPlay(2)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Start 2-Player Duel</span>
                </button>
              </div>

              {/* 4-Player Battle */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/60 transition flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Crown className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-white">4-Player Classic Battle</h4>
                  <p className="text-xs text-slate-400">
                    Full 4-corner Ludo battle (Red, Green, Yellow, Blue). First player to home all 4 pawns wins!
                  </p>
                </div>

                <button
                  onClick={() => handleStartPassAndPlay(4)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start 4-Player Match</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ONLINE PLAYERS & DIRECT CHALLENGES */}
        {activeTab === 'online_players' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Online Players Lobby
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    {onlinePlayers.length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Select an opponent to send a 1v1 challenge. You will verse each other on opposite sides of the board!
                </p>
              </div>

              <button
                onClick={fetchOnlinePlayers}
                disabled={isFetchingPlayers}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 border border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPlayers ? 'animate-spin' : ''}`} />
                <span>Refresh Players</span>
              </button>
            </div>

            {/* Online Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {onlinePlayers.map((player) => (
                <div
                  key={player.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 transition flex flex-col justify-between space-y-3 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-xl shadow-md border border-white/10">
                        {player.avatar}
                      </div>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{player.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-800 text-amber-400 rounded">
                          🇺🇬 UG
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                        <span className="text-amber-400 font-bold">⭐ {player.rating} ELO</span>
                        <span>•</span>
                        <span className="text-emerald-400 text-[11px]">Ready to duel</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setChallengingPlayer(player);
                      setChallengeStake(0);
                      setChallengeSuccessMsg(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <Swords className="w-3.5 h-3.5 fill-slate-950" />
                    <span>⚡ Send Challenge</span>
                  </button>
                </div>
              ))}
            </div>

            {onlinePlayers.length === 0 && (
              <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Searching for available opponents in your region...</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CASH STAKES (UGX) */}
        {activeTab === 'stakes' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-black">
                <Flame className="w-3.5 h-3.5" />
                <span>PesaJet UGX Competitive Cash Arena</span>
              </div>
              <h3 className="text-lg font-black text-white">Select Stake Amount</h3>
              <p className="text-xs text-slate-400">
                Winner takes 90% of the total stake pool. 10% platform fee applies.
              </p>
            </div>

            {/* Stake Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ALLOWED_STAKES.map((stake) => (
                <button
                  key={stake}
                  onClick={() => setSelectedStake(stake)}
                  className={`p-3 rounded-2xl border font-mono font-black text-xs transition ${
                    selectedStake === stake
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg scale-105'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  UGX {stake.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Player Count & Quote Breakdown */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">Player Format</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStakePlayerCount(2)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      stakePlayerCount === 2
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    1v1 (Opposite Sides)
                  </button>
                  <button
                    onClick={() => setStakePlayerCount(4)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      stakePlayerCount === 4
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    4 Players
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">
                    Total Pool: UGX {(selectedStake * stakePlayerCount).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-amber-400">
                    Platform Rake (10%): UGX {stakeQuote.platformFee.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Winner Takes</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    UGX {stakeQuote.winnerPrize.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onCreateOnlineRoom(
                  profile.name,
                  profile.avatar,
                  profile.preferredColor,
                  30,
                  false
                );
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl transition flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>Create Stakes Match (UGX {selectedStake.toLocaleString()})</span>
            </button>
          </div>
        )}

        {/* TAB 4: ONLINE ROOMS */}
        {activeTab === 'online' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Room */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-sky-400" />
                Create Private Room
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Turn Timer</label>
                  <div className="flex gap-2">
                    {[15, 30, 45, 60].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTurnTimer(t)}
                        className={`flex-1 py-1.5 rounded-xl border font-mono font-bold ${
                          turnTimer === t
                            ? 'bg-sky-500 text-slate-950 border-sky-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Preferred Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_COLORS.map((c) => {
                      const cfg = COLOR_CONFIG[c];
                      return (
                        <button
                          key={c}
                          onClick={() => setProfile({ ...profile, preferredColor: c })}
                          className={`py-2 rounded-xl border flex items-center justify-center gap-1 font-bold capitalize transition ${
                            profile.preferredColor === c
                              ? 'border-white text-white ring-2 ring-white/20'
                              : 'border-slate-800 opacity-60 text-slate-300'
                          }`}
                          style={{ backgroundColor: cfg.accentHex }}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  onCreateOnlineRoom(
                    profile.name,
                    profile.avatar,
                    profile.preferredColor,
                    turnTimer,
                    withBots
                  )
                }
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Create & Get Room Code</span>
              </button>
            </div>

            {/* Join Room by Code */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Join Room by Code
                </h4>

                <div>
                  <label className="text-slate-400 block mb-1 text-xs font-bold">
                    6-Character Room Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. LUDO77"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono font-black text-lg tracking-widest text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (joinCode.trim().length >= 4) {
                    onJoinOnlineRoom(
                      joinCode.trim(),
                      profile.name,
                      profile.avatar,
                      profile.preferredColor
                    );
                  }
                }}
                disabled={joinCode.trim().length < 4}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Join Game Room</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: PASS & PLAY */}
        {activeTab === 'pass_play' && (
          <div className="space-y-5 max-w-xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">Local Pass & Play</h3>
              <p className="text-xs text-slate-400">
                Play on a single device with friends and family. 2-player matches position players opposite each other!
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setLocalPlayerCount(count)}
                  className={`px-5 py-2.5 rounded-xl border font-bold text-xs transition ${
                    localPlayerCount === count
                      ? 'bg-purple-600 text-white border-purple-400 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {count} Players {count === 2 && '(Opposite Sides)'}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleStartPassAndPlay(localPlayerCount)}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-xl transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Pass & Play ({localPlayerCount} Players)</span>
            </button>
          </div>
        )}

        {/* TAB 6: VS AI BOTS */}
        {activeTab === 'vs_bots' && (
          <div className="space-y-5 max-w-xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">Practice VS AI Bots</h3>
              <p className="text-xs text-slate-400">
                Sharpen your tactical pawn routing against smart artificial intelligence on opposite corners.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="text-slate-400 block font-bold">Bot AI Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', label: 'Casual (Easy)' },
                  { id: 'medium', label: 'Balanced (Medium)' },
                  { id: 'hard', label: 'Master (Hard)' },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => setBotDifficulty(diff.id as any)}
                    className={`py-2 rounded-xl border font-bold transition ${
                      botDifficulty === diff.id
                        ? 'bg-teal-500 text-slate-950 border-teal-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStartVsBots(2)}
                className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white border border-slate-700 font-black text-xs transition"
              >
                1 Human + 1 AI Bot (Opposite Sides)
              </button>
              <button
                onClick={() => handleStartVsBots(4)}
                className="py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-lg transition"
              >
                1 Human + 3 AI Bots
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Challenge Confirmation Modal */}
      {challengingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-3xl mx-auto shadow-xl border border-white/20">
                {challengingPlayer.avatar}
              </div>
              <h3 className="text-lg font-black text-white">
                Challenge {challengingPlayer.name}
              </h3>
              <p className="text-xs text-slate-400">
                ⭐ {challengingPlayer.rating} ELO • Positions will be on opposite sides of the board.
              </p>
            </div>

            {/* Stake Picker for Challenge */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Select Match Format</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { stake: 0, label: 'Free Friendly' },
                  { stake: 2000, label: 'UGX 2,000' },
                  { stake: 5000, label: 'UGX 5,000' },
                  { stake: 10000, label: 'UGX 10,000' },
                  { stake: 20000, label: 'UGX 20,000' },
                  { stake: 50000, label: 'UGX 50,000' },
                ].map((item) => (
                  <button
                    key={item.stake}
                    onClick={() => setChallengeStake(item.stake)}
                    className={`py-2 rounded-xl border text-xs font-bold font-mono transition ${
                      challengeStake === item.stake
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opposite Position Notice */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-300 font-bold">You (Red - Top Left)</span>
              </div>
              <span className="text-slate-500 font-bold">VS</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-bold">Opponent (Yellow - Bottom Right)</span>
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
              </div>
            </div>

            {challengeSuccessMsg ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold text-center animate-pulse">
                {challengeSuccessMsg}
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setChallengingPlayer(null)}
                  disabled={challengeSending}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendChallenge}
                  disabled={challengeSending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <Swords className="w-4 h-4" />
                  <span>{challengeSending ? 'Challenging...' : '⚡ Send Challenge'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Navigation Bar for Lobby */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenRules}
            className="hover:text-white flex items-center gap-1.5 transition"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>How to Play & Rules</span>
          </button>
          <span>•</span>
          <button
            onClick={onOpenLeaderboard}
            className="hover:text-white flex items-center gap-1.5 transition"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>
          <span>•</span>
          <button
            onClick={onOpenStats}
            className="hover:text-white flex items-center gap-1.5 transition"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Player Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};
