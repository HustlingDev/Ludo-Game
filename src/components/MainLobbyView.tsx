import React, { useState, useEffect } from 'react';
import {
  Users,
  Swords,
  ShieldCheck,
  Sparkles,
  Zap,
  Radio,
  Trophy,
  Wallet,
  Scale,
  RefreshCw,
  Plus,
  Play,
  ArrowRight,
  Flame,
  Check,
  Crown,
} from 'lucide-react';
import { PlayerColor } from '../types';
import { UserProfile } from '../hooks/useLudoGame';
import {
  ALLOWED_STAKES,
  calculatePrizePool,
  getServiceFee,
  DiceSkin,
} from '../types/platform';
import { DICE_SKIN_CONFIGS } from './Dice3D';
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

const ALL_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const MainLobbyView: React.FC<MainLobbyViewProps> = ({
  profile,
  setProfile,
  userRating,
  userBalanceUGX = 0,
  selectedDiceSkin = 'classic_ivory',
  setSelectedDiceSkin,
  onStartStakeGame,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onOpenWallet,
  onOpenLeaderboard,
  onOpenRules,
  onOpenStats,
}) => {
  const [selectedStake, setSelectedStake] = useState<number>(500);
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [localDiceSkin, setLocalDiceSkin] = useState<DiceSkin>(selectedDiceSkin);
  const [joinCode, setJoinCode] = useState('');
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(false);
  const [challengingPlayerId, setChallengingPlayerId] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const activeDiceSkin = localDiceSkin;

  // Calculate economics for selected stake & player count
  const prizePoolCalc = calculatePrizePool(selectedStake, playerCount);
  const currentServiceFee = getServiceFee(selectedStake, playerCount);

  // Poll online players in the same stake tier & announce heartbeat
  const fetchStakePlayers = async () => {
    setIsFetchingPlayers(true);
    try {
      // Send heartbeat
      await fetch('/api/lobby/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `usr_${profile.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: profile.name,
          avatar: profile.avatar,
          rating: userRating,
          stake: selectedStake,
          playerCount,
          status: 'available',
        }),
      });

      const res = await fetch('/api/lobby/players');
      const data = await res.json();
      if (data && data.players) {
        // Filter players for this stake room or active pool
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
  }, [profile.name, selectedStake, playerCount, userRating]);

  const handleDiceSelect = (skin: DiceSkin) => {
    setLocalDiceSkin(skin);
    setSelectedDiceSkin?.(skin);
  };

  const handleLaunchGame = () => {
    if (userBalanceUGX < selectedStake) {
      onOpenWallet();
      return;
    }
    onStartStakeGame(selectedStake, playerCount, activeDiceSkin);
  };

  const handleChallengePlayer = (targetPlayer: OnlinePlayer) => {
    setChallengingPlayerId(targetPlayer.id);
    if (userBalanceUGX < selectedStake) {
      onOpenWallet();
      return;
    }

    setTimeout(() => {
      setChallengingPlayerId(null);
      // Auto launch match against target
      onStartStakeGame(selectedStake, playerCount, activeDiceSkin);
    }, 800);
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

  // Filter players matching the selected stake or provide ready contenders
  const playersInThisStake = onlinePlayers.filter((p) => (p.stake || 500) === selectedStake);
  const displayPlayers =
    playersInThisStake.length > 0
      ? playersInThisStake
      : [
          {
            id: 'contender_1',
            name: 'mukasa',
            avatar: '🦁',
            rating: 1320,
            stake: selectedStake,
            status: 'available' as const,
          },
          {
            id: 'contender_2',
            name: 'namubiru',
            avatar: '⚡',
            rating: 1285,
            stake: selectedStake,
            status: 'available' as const,
          },
          {
            id: 'contender_3',
            name: 'katoderrick',
            avatar: '👑',
            rating: 1410,
            stake: selectedStake,
            status: 'available' as const,
          },
          {
            id: 'contender_4',
            name: 'okello',
            avatar: '🎯',
            rating: 1250,
            stake: selectedStake,
            status: 'available' as const,
          },
        ];

  return (
    <div className="w-full h-[calc(100vh-3.8rem)] max-h-screen overflow-hidden flex flex-col p-2 sm:p-3.5 gap-2.5 select-none bg-slate-950 text-slate-100">
      {/* Top Bar: Player Summary & Quick Balances (Zero Scroll layout) */}
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

      {/* Main Grid: Split Static 2-Column Dashboard */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
        {/* Left Column (7 Cols): Stake Selection, Player Count & Dice Templates */}
        <div className="lg:col-span-7 flex flex-col gap-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 overflow-hidden">
          {/* Section 1: Stake Amounts Selection (200 UGX to 10,000 UGX) */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Select Stake Amount (UGX)</span>
              </label>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                Winner takes Net Pot
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {ALLOWED_STAKES.map((stk) => {
                const fee = getServiceFee(stk, playerCount);
                const isSelected = selectedStake === stk;
                return (
                  <button
                    key={stk}
                    onClick={() => setSelectedStake(stk)}
                    className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500 to-yellow-600 border-amber-300 text-slate-950 shadow-lg font-black scale-[1.02]'
                        : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-300 font-bold'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs">
                      {stk >= 1000 ? `${stk / 1000}k` : stk}
                    </span>
                    <span
                      className={`text-[9px] ${
                        isSelected ? 'text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Fee: {fee}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Player Count Selection (2P, 3P, 4P) */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>2. Number of Players</span>
              </label>
              <span className="text-[10px] text-slate-400">Duel or Group Battle</span>
            </div>

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

          {/* Section 3: Dice Templates Picker */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Choose Dice Template Skin</span>
              </label>
              <span className="text-[10px] text-amber-300 font-bold">
                {DICE_SKIN_CONFIGS[activeDiceSkin].name}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(DICE_SKIN_CONFIGS) as DiceSkin[]).map((skinKey) => {
                const skin = DICE_SKIN_CONFIGS[skinKey];
                const isSelected = activeDiceSkin === skinKey;
                return (
                  <button
                    key={skinKey}
                    onClick={() => handleDiceSelect(skinKey)}
                    className={`py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-base">{skin.icon}</span>
                    <span className="text-[9px] font-bold truncate max-w-full">{skin.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Transparent Economics Card */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] text-slate-400 font-bold">Match Stake / Player</div>
              <div className="font-mono font-bold text-white">
                UGX {selectedStake.toLocaleString()}
              </div>
            </div>

            <div className="text-center">
              <div className="text-[10px] text-amber-400 font-bold">
                Service Fee (Paid by Winner)
              </div>
              <div className="font-mono font-bold text-amber-400">
                - UGX {currentServiceFee.toLocaleString()}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">
                Winner Net Prize
              </div>
              <div className="text-sm font-black text-emerald-400 font-mono">
                UGX {prizePoolCalc.winnerPrize.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Big Action Launch Button */}
          <div className="mt-auto pt-1">
            <button
              onClick={handleLaunchGame}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>
                Enter {selectedStake.toLocaleString()} UGX Challenge ({playerCount}P) • Win UGX{' '}
                {prizePoolCalc.winnerPrize.toLocaleString()}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column (5 Cols): Live Stake Room Players & Challenge Queue */}
        <div className="lg:col-span-5 flex flex-col gap-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 overflow-hidden">
          {/* Header of Stake Room */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs font-black text-white">
                UGX {selectedStake.toLocaleString()} Stake Room
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
            Players active in the {selectedStake.toLocaleString()} UGX room ready to duel:
          </p>

          {/* Contenders List (Static height, perfectly fitted) */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
            {displayPlayers.map((player) => (
              <div
                key={player.id}
                className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between hover:border-amber-500/40 transition group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-base shadow-inner">
                    {player.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white group-hover:text-amber-400 transition font-mono lowercase">
                      @{player.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Rating: <span className="text-amber-400 font-bold">{player.rating}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleChallengePlayer(player)}
                  disabled={challengingPlayerId === player.id}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition disabled:opacity-50"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>{challengingPlayerId === player.id ? 'Starting...' : 'Challenge'}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Join Private Room Code Box */}
          <form
            onSubmit={handleJoinByCode}
            className="shrink-0 pt-1 border-t border-slate-800 flex gap-1.5"
          >
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter Room Code (e.g. LUDO-88)"
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-sky-500 uppercase"
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

      {/* Terms & Rules Modal */}
      <TermsOfServiceModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
};
