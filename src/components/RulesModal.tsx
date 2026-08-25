import React from 'react';
import { X, Star, ShieldCheck, Flame, Crown, Dices, Crosshair } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              📖
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Official Ludo Rules & Controls
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs sm:text-sm text-slate-300">
          {/* Controls */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs sm:text-sm">
              <Crosshair className="w-4 h-4 text-indigo-400" />
              Interactive Drag & Drop + Click to Move
            </span>
            <p className="text-xs text-slate-300">
              When it's your turn and you have rolled, you can <strong>drag any glowing pawn</strong> directly to its target highlighted tile, OR simply <strong>tap/click the pawn</strong> to automatically glide it forward!
            </p>
          </div>

          {/* Rule 1: Starting */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              1
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Deploying from Yard</h4>
              <p className="text-xs text-slate-400">
                You must roll a <strong className="text-amber-400">6</strong> to bring a token out of the yard base onto your colored starting square.
              </p>
            </div>
          </div>

          {/* Rule 2: Extra Roll */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              2
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1">
                Bonus Extra Rolls <Flame className="w-3.5 h-3.5 text-amber-400" />
              </h4>
              <p className="text-xs text-slate-400">
                You are rewarded with another roll when you:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-400 mt-1 space-y-0.5">
                <li>Roll a <strong>6</strong> (up to 2 in a row; a 3rd consecutive 6 forfeits the turn).</li>
                <li><strong>Capture</strong> an opponent's token.</li>
                <li>Move a token successfully into the center <strong>Home</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Rule 3: Capturing */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              3
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Capturing Opponents</h4>
              <p className="text-xs text-slate-400">
                Landing on an opponent's token on any regular track square knocks them out back to their yard, and awards you an extra bonus roll!
              </p>
            </div>
          </div>

          {/* Rule 4: Safe Stars */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              4
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1">
                Safe Zones <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </h4>
              <p className="text-xs text-slate-400">
                Tokens on the 4 starting squares and the 4 Star (⭐) tiles cannot be captured. Multiple tokens can safely share these squares.
              </p>
            </div>
          </div>

          {/* Rule 5: Winning */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              5
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1">
                Home Stretch & Winning <Crown className="w-3.5 h-3.5 text-amber-400" />
              </h4>
              <p className="text-xs text-slate-400">
                Tokens enter their team's colored home stretch. You need an exact roll to land in the center Home triangle. The first player to bring all 4 pawns home wins 1st Place!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
