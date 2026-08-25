import React from 'react';
import { GameState, PlayerColor } from '../types';
import { COLOR_CONFIG } from '../utils/boardCoordinates';
import { Trophy, Crown, RotateCcw, Home, Sparkles } from 'lucide-react';

interface VictoryModalProps {
  gameState: GameState;
  onRestart: () => void;
  onLeaveToLobby: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  gameState,
  onRestart,
  onLeaveToLobby,
}) => {
  if (gameState.status !== 'finished') return null;

  const winnerOrder = gameState.winnerOrder;
  const winnerPlayer = gameState.players.find((p) => p.color === winnerOrder[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
        {/* Glow halo */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-sky-500 opacity-30 blur-xl -z-10" />

        {/* Big Trophy */}
        <div className="relative mb-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg border-2 border-amber-200">
            <Trophy className="w-9 h-9 sm:w-11 sm:h-11 text-slate-950" />
          </div>
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👑</div>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
          Match Concluded!
        </h2>
        <p className="text-xs sm:text-sm text-amber-400 font-bold mb-5 flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          <span>
            {winnerPlayer ? `${winnerPlayer.name} takes 1st Place!` : 'Congratulations to the winners!'}
          </span>
        </p>

        {/* Podium Rankings */}
        <div className="w-full space-y-2 mb-6">
          {winnerOrder.map((color, idx) => {
            const player = gameState.players.find((p) => p.color === color);
            const cfg = COLOR_CONFIG[color];
            if (!player) return null;

            const medals = ['🥇', '🥈', '🥉', '4th'];
            const rankBg =
              idx === 0
                ? 'bg-amber-500/20 border-amber-500/50'
                : idx === 1
                ? 'bg-slate-400/20 border-slate-400/40'
                : idx === 2
                ? 'bg-amber-700/20 border-amber-700/40'
                : 'bg-slate-800 border-slate-700';

            return (
              <div
                key={`rank-${color}`}
                className={`p-3 rounded-2xl border flex items-center justify-between ${rankBg}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{medals[idx]}</span>
                  <div
                    className="w-7 h-7 rounded-lg text-sm flex items-center justify-center border border-white/20"
                    style={{ backgroundColor: cfg.accentHex }}
                  >
                    {player.avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs sm:text-sm text-white">{player.name}</div>
                    <div className="text-[10px] capitalize" style={{ color: cfg.accentHex }}>
                      {cfg.name}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-black text-slate-300">
                  {idx === 0 ? 'WINNER' : `Rank #${idx + 1}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={onRestart}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onLeaveToLobby}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 active:scale-95 flex items-center justify-center gap-1.5 transition"
          >
            <Home className="w-4 h-4" />
            <span>Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
