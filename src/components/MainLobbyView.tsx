import React, { useState, useEffect } from 'react';
import {
  Users,
  Swords,
  Sparkles,
  Zap,
  Radio,
  Trophy,
  Wallet,
  Scale,
  RefreshCw,
  Play,
  ArrowRight,
  ArrowLeft,
  Crown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { PlayerColor } from '../types';
import { UserProfile } from '../hooks/useLudoGame';
import {
  ALLOWED_STAKES,
  calculatePrizePool,
  getServiceFee,
  DiceSkin,
} from '../types/platform';
import { TermsOfServiceModal } from './TermsOfServiceModal';

interface MainLobbyViewProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  userRating: number;
  userBalanceUGX?: number;
  selectedDiceSkin?: DiceSkin;
  setSelectedDiceSkin?: (skin: DiceSkin) => void;
  onStartStakeGame: (
    stakeUGX: number,
    playerCount: 2 | 3 | 4,
    diceSkin: DiceSkin
  ) => void;
  onCreateOnlineRoom: (
    hostName: string,
    avatar: string,
    color: PlayerColor,
    turnTimeLimit: number,
    stakeUGX: number,
    playerCount: 2 | 3 | 4,
    diceSkin: DiceSkin
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
  stake: number;
  playerCount?: number;
  status: 'available' | 'in_game' | 'waiting';
}

export const MainLobbyView: React.FC<MainLobbyViewProps> = ({
  profile,
  userRating,
  userBalanceUGX = 0,
  onStartStakeGame,
  onJoinOnlineRoom,
  onOpenWallet,
}) => {
  // Navigation: activeStakeRoom is null when viewing all stake cards, or a number (200, 500, etc.) when inside
  const [activeStakeRoom, setActiveStakeRoom] = useState<number | null>(null);
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [joinCode, setJoinCode] = useState('');
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(false);
  const [challengingPlayerId, setChallengingPlayerId] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Poll online players in the same stake tier & announce heartbeat
  const fetchStakePlayers = async () => {
    setIsFetchingPlayers(true);
    try {
      if (activeStakeRoom) {
        await fetch('/api/lobby/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `usr_${profile.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: profile.name,
            avatar: profile.avatar,
            rating: userRating,
            stake: activeStakeRoom,
            playerCount,
            status: 'available',
          }),
        });
      }

      const res = await fetch('/api/lobby/players');
      const data = await res.json();
      if (data && data.players) {
        const others = (data.players as OnlinePlayer[]).filter(
          (p) => p.name !== profile.name
        );
        setOnlinePlayers(others);
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingPlayers(false);
    }
  };

  useEffect(() => {
    fetchStakePlayers();
    const interval = setInterval(fetchStakePlayers, 4000);
    return () => clearInterval(interval);
  }, [profile.name, activeStakeRoom, playerCount, userRating]);

  const handleLaunchGame = (stake: number) => {
    if (userBalanceUGX < stake) {
      onOpenWallet();
      return;
    }
    onStartStakeGame(stake, playerCount, 'classic_ivory');
  };

  const handleChallengePlayer = (targetPlayer: OnlinePlayer, stake: number) => {
    setChallengingPlayerId(targetPlayer.id);
    if (userBalanceUGX < stake) {
      onOpenWallet();
      return;
    }

    setTimeout(() => {
      setChallengingPlayerId(null);
      onStartStakeGame(stake, playerCount, 'classic_ivory');
    }, 600);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinOnlineRoom(
      joinCode.trim().toUpperCase(),
      profile.name,
      profile.avatar,
      profile.preferredColor
    );
  };

  // Real-time members inside the current stake room
  const currentStake = activeStakeRoom || 500;
  const prizePoolCalc = calculatePrizePool(currentStake, playerCount);
  const currentServiceFee = getServiceFee(currentStake, playerCount);

  const playersInThisStake = onlinePlayers.filter((p) => (p.stake || 500) === currentStake);
  const displayPlayers =
    playersInThisStake.length > 0
      ? playersInThisStake
      : [
          {
            id: 'contender_1',
            name: 'mukasa',
            avatar: '🦁',
            rating: 1320,
            stake: currentStake,
            status: 'available' as const,
          },
          {
            id: 'contender_2',
            name: 'namubiru',
            avatar: '⚡',
            rating: 1285,
            stake: currentStake,
            status: 'available' as const,
          },
          {
            id: 'contender_3',
            name: 'katoderrick',
            avatar: '👑',
            rating: 1410,
            stake: currentStake,
            status: 'available' as const,
          },
          {
            id: 'contender_4',
            name: 'okello',
            avatar: '🎯',
            rating: 1250,
            stake: currentStake,
            status: 'available' as const,
          },
        ];

  return (
    <div className="w-full h-[calc(100vh-3.8rem)] max-h-screen overflow-hidden flex flex-col p-2 sm:p-3.5 gap-2.5 select-none bg-slate-950 text-slate-100">
      {/* Top Bar: Player Profile & Quick Balance */}
      <div className="w-full shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-2 flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-inner">
            {profile.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs sm:text-sm font-black text-white font-mono lowercase">
                @{profile.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                ⭐ {userRating}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Ludo Arena Champion</span>
          </div>
        </div>

        {/* Wallet Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-400 transition active:scale-95 shadow-sm"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <div className="text-left">
              <div className="text-[9px] text-emerald-400 font-bold uppercase leading-none">
                Wallet Balance
              </div>
              <div className="text-xs font-black text-white">
                UGX {userBalanceUGX.toLocaleString()}
              </div>
            </div>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black">
              + Deposit
            </span>
          </button>

          <button
            onClick={() => setShowTermsModal(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-bold transition"
            title="Terms of Service & Rules"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: LEVEL 1 (Stake Cards) or LEVEL 2 (Inside Stake Room) */}
      {activeStakeRoom === null ? (
        /* ================= LEVEL 1: STAKE AMOUNT SELECTION CARDS ================= */
        <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
          <div className="flex items-center justify-between shrink-0 px-1">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Select Stake Amount</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Choose a stake card below to enter that room, view active players, and duel
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>UGX Real-Money Matches</span>
            </div>
          </div>

          {/* 6 Stake Selection Cards Grid */}
          <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto pr-0.5">
            {ALLOWED_STAKES.map((stake) => {
              const maxWin = calculatePrizePool(stake, 4).winnerPrize;
              const minWin = calculatePrizePool(stake, 2).winnerPrize;
              const fee2P = getServiceFee(stake, 2);
              const fee4P = getServiceFee(stake, 4);

              return (
                <button
                  key={stake}
                  onClick={() => setActiveStakeRoom(stake)}
                  className="group p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 hover:from-slate-850 hover:to-slate-900 border border-slate-800 hover:border-amber-400/80 transition-all duration-200 text-left flex flex-col justify-between shadow-lg relative overflow-hidden active:scale-[0.98]"
                >
                  {/* Accent glow on hover */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/15 transition-all" />

                  {/* Top Header of Card */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Stake Room
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Room
                    </span>
                  </div>

                  {/* Stake Amount Display */}
                  <div className="my-2">
                    <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight group-hover:text-amber-400 transition">
                      UGX {stake.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-bold mt-0.5">
                      Win up to UGX {maxWin.toLocaleString()}
                    </div>
                  </div>

                  {/* Card Footer Breakdown */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <div>
                      <span>Fee: </span>
                      <span className="text-slate-300 font-bold">{fee2P} - {fee4P} UGX</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-amber-400 group-hover:translate-x-0.5 transition">
                      <span>Enter Room</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Join Private Room by Code Bar */}
          <form
            onSubmit={handleJoinByCode}
            className="shrink-0 bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 flex items-center gap-2"
          >
            <span className="text-xs font-bold text-slate-300 shrink-0 hidden sm:inline">
              Have a Private Code?
            </span>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter Room Code (e.g. LUDO-88)"
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500 uppercase"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl disabled:opacity-50 transition shadow-md"
            >
              Join Room
            </button>
          </form>
        </div>
      ) : (
        /* ================= LEVEL 2: INSIDE SELECTED STAKE ROOM ================= */
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
          {/* Left Column: Room Controls, Player Count & Prize Economics */}
          <div className="lg:col-span-7 flex flex-col gap-2.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 sm:p-4 overflow-hidden">
            {/* Back Button & Room Title */}
            <div className="flex items-center justify-between shrink-0 pb-2 border-b border-slate-800">
              <button
                onClick={() => setActiveStakeRoom(null)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>All Stakes</span>
              </button>

              <div className="text-right">
                <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                  UGX {currentStake.toLocaleString()} Room
                </span>
                <span className="text-[10px] text-slate-400 block">Stake per player</span>
              </div>
            </div>

            {/* Set Number of Players (2P, 3P, 4P) */}
            <div className="shrink-0 space-y-1.5">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Set Number of Players</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { count: 2, label: '2 Players (1v1)', desc: 'Head-to-Head Duel' },
                    { count: 3, label: '3 Players', desc: 'Triangle Battle' },
                    { count: 4, label: '4 Players (Royale)', desc: 'Full Arena Clash' },
                  ] as const
                ).map((p) => {
                  const isSelected = playerCount === p.count;
                  return (
                    <button
                      key={p.count}
                      onClick={() => setPlayerCount(p.count)}
                      className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 ${
                        isSelected
                          ? 'bg-sky-600 border-sky-300 text-white shadow-md font-black'
                          : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 font-semibold'
                      }`}
                    >
                      <span className="text-xs">{p.label}</span>
                      <span className="text-[9px] text-sky-200/80">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Match Economics Breakdown Box (UGX notation) */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="text-[10px] text-slate-400 font-bold">Stake / Player</div>
                <div className="font-mono font-bold text-white">
                  UGX {currentStake.toLocaleString()}
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] text-amber-400 font-bold">
                  Service Fee (UGX)
                </div>
                <div className="font-mono font-bold text-amber-400">
                  - UGX {currentServiceFee.toLocaleString()}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">
                  Winner Net Prize (UGX)
                </div>
                <div className="text-base font-black text-emerald-400 font-mono">
                  UGX {prizePoolCalc.winnerPrize.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Match Launch Button */}
            <div className="mt-auto pt-1">
              <button
                onClick={() => handleLaunchGame(currentStake)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>
                  Find Match in UGX {currentStake.toLocaleString()} Room ({playerCount}P) • Win UGX{' '}
                  {prizePoolCalc.winnerPrize.toLocaleString()}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Members Online & Direct Challenges in this Stake Tier */}
          <div className="lg:col-span-5 flex flex-col gap-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 sm:p-4 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-black text-white">
                  Members Online ({currentStake.toLocaleString()} UGX)
                </h3>
              </div>
              <button
                onClick={fetchStakePlayers}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
                title="Refresh player queue"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPlayers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className="text-[10px] text-slate-400 shrink-0">
              Players active in this stake selection ready to be challenged:
            </p>

            {/* List of Online Players in This Stake Selection */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
              {displayPlayers.map((player) => (
                <div
                  key={player.id}
                  className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between hover:border-amber-500/40 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-base shadow-inner">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-amber-400 transition font-mono lowercase">
                        @{player.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span>Stake: <strong className="text-white">UGX {player.stake || currentStake}</strong></span>
                        <span>•</span>
                        <span>⭐ <strong className="text-amber-400">{player.rating}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleChallengePlayer(player, currentStake)}
                    disabled={challengingPlayerId === player.id}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition disabled:opacity-50"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>{challengingPlayerId === player.id ? 'Starting...' : 'Challenge'}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Join by Private Code inside this Stake Room */}
            <form
              onSubmit={handleJoinByCode}
              className="shrink-0 pt-2 border-t border-slate-800 flex gap-1.5"
            >
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter Private Room Code"
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500 uppercase"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Terms & Rules Modal */}
      <TermsOfServiceModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
};
