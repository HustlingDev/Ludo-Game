import React from 'react';
import { ShieldCheck, X, FileText, AlertTriangle, Scale, Award, Wallet, Clock } from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Ludo Arena Terms of Service</h2>
              <p className="text-xs text-slate-400">Uganda Real-Money Skill Gaming & Fair Competition Rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed text-slate-300">
          {/* 18+ Warning Banner */}
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-xs sm:text-sm text-rose-200">Mandatory Age Requirement: 18+ Only</div>
              <div className="text-xs text-rose-300/90 mt-0.5">
                You must be at least 18 years of age and legally competent under Ugandan law to create an account, deposit UGX funds, or participate in real-money stake challenges.
              </div>
            </div>
          </div>

          <section className="space-y-1.5">
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              1. Nature of the Game (Skill-Based Competition)
            </h3>
            <p className="text-slate-400">
              Ludo Arena is a competitive, peer-to-peer digital board game governed by mathematical probability, spatial strategy, token risk management, and competitive decision-making. Matches are determined by player decisions and game rules, not random chance algorithms.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              2. Stakes, Prize Pots & Transparent Service Fees
            </h3>
            <p className="text-slate-400">
              Players choose stake tiers ranging from <strong>UGX 200 to UGX 10,000</strong>. When a match commences, players contribute their agreed stake to the match prize pot. A standardized, transparent platform service fee is deducted exclusively from the <strong>winner's pot payout</strong> upon match conclusion:
            </p>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-300">
              <div>• <strong>UGX 200 Stake</strong>: 2P Fee: UGX 30 (Net: 370) | 3P Fee: UGX 50 (Net: 550) | 4P Fee: UGX 60 (Net: 740)</div>
              <div>• <strong>UGX 500 Stake</strong>: 2P Fee: UGX 50 (Net: 950) | 3P Fee: UGX 80 (Net: 1,420) | 4P Fee: UGX 100 (Net: 1,900)</div>
              <div>• <strong>UGX 1,000 Stake</strong>: 2P Fee: UGX 100 (Net: 1,900) | 3P Fee: UGX 200 (Net: 2,800) | 4P Fee: UGX 300 (Net: 3,700)</div>
              <div>• <strong>UGX 2,000 Stake</strong>: 2P Fee: UGX 400 (Net: 3,600) | 3P Fee: UGX 500 (Net: 5,500) | 4P Fee: UGX 800 (Net: 7,200)</div>
              <div>• <strong>UGX 5,000 Stake</strong>: 2P Fee: UGX 1,000 (Net: 9,000) | 3P Fee: UGX 1,500 (Net: 13,500) | 4P Fee: UGX 2,000 (Net: 18,000)</div>
              <div>• <strong>UGX 10,000 Stake</strong>: 2P Fee: UGX 2,000 (Net: 18,000) | 3P Fee: UGX 3,000 (Net: 27,000) | 4P Fee: UGX 4,500 (Net: 35,500)</div>
            </div>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              3. Turn Timers, Inactivity & 2-Strike Kick Rule
            </h3>
            <p className="text-slate-400">
              To protect fair play and prevent deliberate delays:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs sm:text-sm">
              <li>Each player has <strong>15 seconds</strong> to roll the dice and execute a token move.</li>
              <li>Missing a turn results in an automatic turn skip (Strike 1).</li>
              <li>A second consecutive timeout (20s) results in immediate <strong>match forfeiture & kick</strong>. The kicked player forfeits their stake to the match pot, and remaining players continue until a winner claims the prize.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              4. Deposits, Withdrawals & Identity Rules
            </h3>
            <p className="text-slate-400">
              Deposits and withdrawals are processed via Ugandan Mobile Money (MTN MoMo and Airtel Money). The minimum withdrawal limit is <strong>UGX 1,000</strong>. Withdrawals are paid directly to the verified phone number set in your player profile.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              5. Fair Play, Anti-Bot & Account Integrity
            </h3>
            <p className="text-slate-400">
              Any attempt to utilize unauthorized software, automated bots, multi-accounting, collusion, or fraudulent chargebacks will result in permanent account suspension and confiscation of illicit balances.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 active:scale-95 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
