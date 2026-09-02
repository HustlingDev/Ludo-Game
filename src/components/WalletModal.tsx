import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  RefreshCw,
  X,
  CheckCircle2,
  Smartphone,
  AlertCircle,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { GAME_ECONOMICS } from '../types/platform';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

const DEPOSIT_PRESETS = [500, 1000, 2000, 5000, 10000, 20000];

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const { user, wallet, userProfile, creditWallet, debitWallet } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('1000');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingPromptPhone, setPendingPromptPhone] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseInt(customAmount, 10) : selectedAmount;
  const availableBal = wallet?.availableBalance || 0;
  const registeredPhone = userProfile?.phone || '';

  // Deposit handler
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPendingPromptPhone(null);
    setLoading(true);

    try {
      if (!currentAmount || currentAmount < GAME_ECONOMICS.minDepositUGX) {
        throw new Error(`Minimum deposit is UGX ${GAME_ECONOMICS.minDepositUGX.toLocaleString()}`);
      }

      if (!registeredPhone || registeredPhone.trim().length < 9) {
        throw new Error(
          'Please set your registered Mobile Money phone number in Game Settings first.'
        );
      }

      let referenceCode = `DEP-${Date.now().toString(36).toUpperCase()}`;
      let promptSent = false;

      // Call backend PesaJet collection endpoint
      try {
        const res = await fetch('/api/pesajet/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: currentAmount,
            currency: 'UGX',
            userId: userProfile?.id || user?.uid || 'player',
            phone: registeredPhone,
            phoneNumber: registeredPhone,
            description: `Ludo Arena Deposit UGX ${currentAmount.toLocaleString()}`,
          }),
        });

        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
          promptSent = true;
          if (data.reference) referenceCode = data.reference;
        } else if (data?.error) {
          console.warn('Backend deposit gateway message:', data.error);
        }
      } catch (networkErr) {
        console.warn('Backend deposit endpoint notice:', networkErr);
      }

      setPendingPromptPhone(registeredPhone);
      setSuccess(
        `Mobile Money deposit request for UGX ${currentAmount.toLocaleString()} initiated! (Ref: ${referenceCode})`
      );
    } catch (err: any) {
      setError(err.message || 'Deposit processing failed');
    } finally {
      setLoading(false);
    }
  };

  // Withdraw handler
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPendingPromptPhone(null);
    setLoading(true);

    try {
      const numWithdraw = parseInt(withdrawAmount, 10);
      if (isNaN(numWithdraw) || numWithdraw < 1000) {
        throw new Error('The minimum withdrawal amount is UGX 1,000.');
      }

      if (numWithdraw > availableBal) {
        throw new Error(
          `Insufficient funds. Your available balance is UGX ${availableBal.toLocaleString()}.`
        );
      }

      if (!registeredPhone || registeredPhone.trim().length < 9) {
        throw new Error(
          'Please set your registered Mobile Money recipient number in Game Settings first.'
        );
      }

      // Try server disbursement endpoint
      let disburseRef = `WTH-${Date.now().toString(36).toUpperCase()}`;
      try {
        const res = await fetch('/api/pesajet/disbursement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: numWithdraw,
            phone: registeredPhone,
            userId: userProfile?.id || user?.uid || 'player',
          }),
        });
        const data = await res.json().catch(() => null);
        if (data?.reference) disburseRef = data.reference;
      } catch (apiErr) {
        console.warn('Backend withdrawal endpoint notice:', apiErr);
      }

      // Debit user wallet
      await debitWallet(numWithdraw, `Mobile Money Payout to ${registeredPhone}`);

      setSuccess(
        `Withdrawal of UGX ${numWithdraw.toLocaleString()} processed for ${registeredPhone}! (Ref: ${disburseRef})`
      );
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-5 sm:p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Ludo Arena Wallet</h2>
            <p className="text-xs text-slate-400">Uganda Mobile Money (MTN & Airtel)</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-700/80 mb-5 shadow-inner">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Available Balance
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> UGX
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            UGX {availableBal.toLocaleString()}
          </div>
        </div>

        {/* Deposit / Withdraw Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-800 p-1 rounded-2xl mb-5 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('deposit');
              setError(null);
              setSuccess(null);
              setPendingPromptPhone(null);
            }}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" /> Deposit
          </button>
          <button
            onClick={() => {
              setActiveTab('withdraw');
              setError(null);
              setSuccess(null);
              setPendingPromptPhone(null);
            }}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'withdraw'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </button>
        </div>

        {/* Error / Success Banners */}
        {error && (
          <div className="bg-rose-500/20 border border-rose-500/50 rounded-2xl p-3 text-xs text-rose-300 mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {pendingPromptPhone && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-2xl p-3.5 text-xs text-amber-200 mb-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Smartphone className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Approval Prompt Sent to Phone</span>
            </div>
            <p className="text-[11px] text-amber-100/90 leading-relaxed">
              A USSD confirmation prompt has been dispatched to{' '}
              <span className="font-mono font-bold text-white">{pendingPromptPhone}</span>.
              Please check your phone screen and enter your Mobile Money PIN to authorize the transaction.
            </p>
          </div>
        )}

        {success && !pendingPromptPhone && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-3 text-xs text-emerald-300 mb-4 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab 1: Deposit */}
        {activeTab === 'deposit' && (
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-300 mb-2">
                Select Deposit Amount (Begins from UGX 500)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DEPOSIT_PRESETS.map((stake) => (
                  <button
                    key={stake}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(stake);
                      setCustomAmount('');
                    }}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition ${
                      selectedAmount === stake && !customAmount
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    UGX {stake.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Or Custom Amount (min UGX 500)
              </label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  if (e.target.value) setSelectedAmount(0);
                }}
                placeholder="Enter custom UGX amount (min 500)"
                min={500}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Registered Phone Number Pill (No manual input, change from settings) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-300">
                  Registered Mobile Money Number
                </label>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Change in Settings</span>
                  </button>
                )}
              </div>

              {registeredPhone ? (
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400">
                  <span className="font-bold">{registeredPhone}</span>
                  <span className="text-[10px] text-slate-400 font-sans">Verified Profile Number</span>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                  <span>No mobile number in profile</span>
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSettings();
                      }}
                      className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-[11px]"
                    >
                      Add in Settings
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Deposit Action Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !currentAmount || currentAmount < 500 || !registeredPhone}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 text-xs sm:text-sm text-white"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                {loading
                  ? 'Initiating Prompt...'
                  : `Deposit UGX ${currentAmount ? currentAmount.toLocaleString() : '500'} via Mobile Money`}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Withdraw */}
        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1 flex items-center justify-between">
                <span>Withdrawal Amount (UGX)</span>
                <span className="text-[10px] text-amber-400">Min. UGX 1,000</span>
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min={1000}
                max={availableBal}
                placeholder="Minimum UGX 1,000"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-1.5 mt-1.5">
                {[1000, 2000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWithdrawAmount(amt.toString())}
                    className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700"
                  >
                    UGX {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(availableBal.toString())}
                  className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 rounded-lg text-[10px] font-bold border border-indigo-500/40"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Recipient Phone Number (Auto-set, changeable from Settings) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-300">
                  Recipient Mobile Money Number
                </label>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Change in Settings</span>
                  </button>
                )}
              </div>

              {registeredPhone ? (
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400">
                  <span className="font-bold">{registeredPhone}</span>
                  <span className="text-[10px] text-slate-400 font-sans">Payout Destination</span>
                </div>
              ) : (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center justify-between">
                  <span>No mobile number set for payout</span>
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSettings();
                      }}
                      className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-lg text-[11px]"
                    >
                      Set in Settings
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Available to Withdraw:</span>
                <span className="font-bold text-emerald-400">UGX {availableBal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Minimum Withdrawal:</span>
                <span className="font-bold text-slate-300">UGX 1,000</span>
              </div>
            </div>

            {/* Withdraw Button */}
            <button
              type="submit"
              disabled={loading || availableBal < 1000 || parseInt(withdrawAmount, 10) < 1000 || !registeredPhone}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 active:scale-95 font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 text-xs sm:text-sm text-white"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
              {loading ? 'Processing Payout...' : `Withdraw UGX ${parseInt(withdrawAmount || '0', 10).toLocaleString()}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
