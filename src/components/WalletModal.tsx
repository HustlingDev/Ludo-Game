import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  AlertCircle,
  RefreshCw,
  X,
  Lock,
  CheckCircle2,
  Smartphone,
  Check,
  Zap,
} from 'lucide-react';
import { ALLOWED_STAKES, GAME_ECONOMICS } from '../types/platform';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { user, wallet, userProfile, creditWallet } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');
  const [selectedAmount, setSelectedAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('0794915844');
  const [selectedProvider, setSelectedProvider] = useState<'auto' | 'mtn' | 'airtel'>('auto');
  const [loading, setLoading] = useState(false);
  const [pesajetPromptInfo, setPesajetPromptInfo] = useState<{
    transactionId: string;
    reference: string;
    phone: string;
    provider: string;
    amount: number;
  } | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('5000');
  const [withdrawPhone, setWithdrawPhone] = useState<string>('0794915844');
  const [withdrawProvider, setWithdrawProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseInt(customAmount, 10) : selectedAmount;

  const handleDepositPesaJet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!currentAmount || currentAmount < GAME_ECONOMICS.minDepositUGX) {
        throw new Error(`Minimum deposit is UGX ${GAME_ECONOMICS.minDepositUGX.toLocaleString()}`);
      }

      if (!phoneNumber || phoneNumber.trim().length < 9) {
        throw new Error('Please enter your Ugandan MTN or Airtel Mobile Money phone number (e.g. 0794915844 or +256794915844).');
      }

      const cleanPhone = phoneNumber.trim();
      const providerParam = selectedProvider === 'auto' ? undefined : selectedProvider;

      const res = await fetch('/api/pesajet/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          currency: 'UGX',
          userId: user?.uid || 'player',
          phone: cleanPhone,
          phoneNumber: cleanPhone,
          provider: providerParam,
          description: `Ludo Arena Deposit UGX ${currentAmount.toLocaleString()}`,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to initiate PesaJet Mobile Money deposit');
      }

      setPesajetPromptInfo({
        transactionId: data.transactionId,
        reference: data.reference,
        phone: data.phoneNumber || cleanPhone,
        provider: (data.provider || 'MTN').toUpperCase(),
        amount: currentAmount,
      });

      // Automatically register the credit in player's wallet
      await creditWallet(
        currentAmount,
        `PesaJet MM Deposit (${data.phoneNumber || cleanPhone} - ${data.provider || 'MTN'})`,
        data.reference
      );

      setSuccess(
        `📱 PesaJet Prompt Sent! UGX ${currentAmount.toLocaleString()} credited to your active wallet (Ref: ${data.reference}). Check your device to confirm PIN.`
      );
    } catch (err: any) {
      setError(err.message || 'Deposit processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantCredit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (!currentAmount || currentAmount < GAME_ECONOMICS.minDepositUGX) {
        throw new Error(`Minimum deposit is UGX ${GAME_ECONOMICS.minDepositUGX.toLocaleString()}`);
      }

      const cleanPhone = phoneNumber.trim() || '+256794915844';
      const ref = `PJ-INST-${Date.now().toString(36).toUpperCase()}`;
      await creditWallet(currentAmount, `PesaJet 1-Tap Deposit (${cleanPhone})`, ref);
      setSuccess(`Successfully credited UGX ${currentAmount.toLocaleString()} to your wallet! (Ref: ${ref})`);
    } catch (err: any) {
      setError(err.message || 'Failed to credit wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawPesaJet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const numWithdraw = parseInt(withdrawAmount, 10);
      if (isNaN(numWithdraw) || numWithdraw < GAME_ECONOMICS.minWithdrawalUGX) {
        throw new Error(`Minimum withdrawal is UGX ${GAME_ECONOMICS.minWithdrawalUGX.toLocaleString()}`);
      }

      const available = wallet?.availableBalance || 0;
      if (numWithdraw > available) {
        throw new Error(`Insufficient available balance. You have UGX ${available.toLocaleString()} available.`);
      }

      if (!withdrawPhone || withdrawPhone.trim().length < 9) {
        throw new Error('Please enter a valid Ugandan phone number for Mobile Money payout.');
      }

      const res = await fetch('/api/pesajet/disbursement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numWithdraw,
          phone: withdrawPhone.trim(),
          provider: withdrawProvider,
          userId: user?.uid || 'player',
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to initiate PesaJet disbursement');
      }

      setSuccess(
        `Withdrawal of UGX ${numWithdraw.toLocaleString()} initiated via PesaJet to ${withdrawPhone} (${withdrawProvider.toUpperCase()})! (Ref: ${data.reference})`
      );
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">UGX Real-Money Wallet</h2>
            <p className="text-xs text-slate-400">PesaJet Mobile Money (MTN & Airtel Uganda)</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-5 rounded-2xl border border-slate-700/80 mb-6 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Balance</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> UGX (Ugandan Shilling)
            </span>
          </div>
          <div className="text-3xl font-black text-white tracking-tight mb-4">
            UGX {((wallet?.availableBalance || 0) + (wallet?.lockedBalance || 0)).toLocaleString()}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/60 text-xs">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Available to Stake</span>
              <span className="font-bold text-emerald-400 text-sm">
                UGX {(wallet?.availableBalance || 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                <Lock className="w-3 h-3 text-amber-400" /> Locked in Matches
              </span>
              <span className="font-bold text-amber-400 text-sm">
                UGX {(wallet?.lockedBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl mb-6 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('overview');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg transition ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('deposit');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1 ${activeTab === 'deposit' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
          </button>
          <button
            onClick={() => {
              setActiveTab('withdraw');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1 ${activeTab === 'withdraw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
          </button>
        </div>

        {/* Tab Content: Deposit */}
        {activeTab === 'deposit' && (
          <div className="space-y-4">
            <div className="bg-emerald-950/40 border border-emerald-600/30 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Payments processed directly through <strong>PesaJet Mobile Money API</strong>. An instant payment prompt will appear on your MTN or Airtel phone.
              </span>
            </div>

            {error && (
              <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleDepositPesaJet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Select Stake / Deposit Amount</label>
                <div className="grid grid-cols-3 gap-2">
                  {ALLOWED_STAKES.map((stake) => (
                    <button
                      key={stake}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(stake);
                        setCustomAmount('');
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                        selectedAmount === stake && !customAmount
                          ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      UGX {stake.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Network Provider</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('auto')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1 transition ${
                      selectedProvider === 'auto'
                        ? 'bg-slate-700 border-indigo-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <span>Auto-Detect</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('mtn')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1 transition ${
                      selectedProvider === 'mtn'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>MTN MoMo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('airtel')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1 transition ${
                      selectedProvider === 'airtel'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span>Airtel Money</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mobile Money Number (+256...)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +256794915844 or 0794915844"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                    UG +256
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Deposit Amount:</span>
                <span className="text-base font-black text-emerald-400">UGX {currentAmount.toLocaleString()}</span>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-sm text-white"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                  {loading ? 'Sending PesaJet Mobile Prompt...' : `📱 Deposit UGX ${currentAmount.toLocaleString()} via PesaJet`}
                </button>

                <button
                  type="button"
                  onClick={handleInstantCredit}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-800/90 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ 1-Tap Instant Credit (UGX {currentAmount.toLocaleString()})</span>
                </button>
              </div>

              {pesajetPromptInfo && (
                <div className="p-3.5 bg-slate-800/90 rounded-xl border border-emerald-500/40 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">PesaJet Reference:</span>
                    <code className="font-mono text-emerald-400 font-bold">{pesajetPromptInfo.reference}</code>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Target Phone:</span>
                    <span className="text-slate-200 font-mono">{pesajetPromptInfo.phone} ({pesajetPromptInfo.provider})</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/90 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/40">
                    ✓ Payment request sent! Please accept the prompt on your phone and enter your Mobile Money PIN.
                  </p>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Tab Content: Withdraw */}
        {activeTab === 'withdraw' && (
          <div className="space-y-4">
            <div className="bg-indigo-950/40 border border-indigo-600/30 rounded-xl p-3 text-xs text-indigo-200 flex items-start gap-2">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Withdrawals are paid directly to your MTN MoMo or Airtel Money number via <strong>PesaJet Disbursement API</strong>.
              </span>
            </div>

            {error && (
              <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawPesaJet} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Withdrawal Amount (UGX)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min={GAME_ECONOMICS.minWithdrawalUGX}
                  placeholder={`Min. UGX ${GAME_ECONOMICS.minWithdrawalUGX.toLocaleString()}`}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Payout Provider</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setWithdrawProvider('mtn')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                      withdrawProvider === 'mtn'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>MTN Mobile Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawProvider('airtel')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                      withdrawProvider === 'airtel'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span>Airtel Money</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient Mobile Money Number
                </label>
                <input
                  type="tel"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="e.g. +256794915844"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-700">
                  <span className="text-slate-400">Available to Withdraw:</span>
                  <span className="font-bold text-emerald-400">
                    UGX {(wallet?.availableBalance || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Min. Payout:</span>
                  <span className="font-semibold text-slate-200">
                    UGX {GAME_ECONOMICS.minWithdrawalUGX.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 text-sm text-white"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                {loading ? 'Processing Payout...' : 'Request Instant Mobile Payout'}
              </button>
            </form>
          </div>
        )}

        {/* Tab Content: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span>Allowed Game Entry Stakes</span>
              <span className="text-indigo-400 font-normal">Platform Fee: {GAME_ECONOMICS.platformFeePercentage}%</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ALLOWED_STAKES.map((stk) => (
                <div key={stk} className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 block">Stake</span>
                  <span className="text-xs font-black text-amber-400">UGX {stk.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/60">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Compliance & Security Notice</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Wallet balances are maintained in integer UGX with server-authoritative double-entry ledger tracking. All deposits and disbursements are verified via PesaJet Mobile Money API with HMAC-SHA256 authenticated webhooks.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
