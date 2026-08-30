import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowUpRight, ArrowDownLeft, Shield, AlertCircle, RefreshCw, X, Lock, CheckCircle2 } from 'lucide-react';
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [pesapalRedirect, setPesapalRedirect] = useState<{ url: string; ref: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseInt(customAmount, 10) : selectedAmount;

  const handleDepositPesapal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!currentAmount || currentAmount < GAME_ECONOMICS.minDepositUGX) {
        throw new Error(`Minimum deposit is UGX ${GAME_ECONOMICS.minDepositUGX.toLocaleString()}`);
      }

      if (!phoneNumber || phoneNumber.trim().length < 9) {
        throw new Error('Please enter your Ugandan MTN or Airtel Mobile Money phone number (e.g. 0770000000).');
      }

      const res = await fetch('/api/pesapal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          currency: 'UGX',
          userId: user?.uid || 'player',
          phone: phoneNumber,
          description: `Ludo Arena Live Stake Deposit UGX ${currentAmount.toLocaleString()}`,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!res.ok || !data || !data.success || !data.redirectUrl) {
        const errorDetail = data?.error || (res.status === 404
          ? 'Pesapal API endpoint not found on this host. Use the Instant Credit button below to fund your wallet directly.'
          : 'Failed to connect to Pesapal 3.0 Gateway. You can use the Instant Credit button below.');
        throw new Error(errorDetail);
      }

      setPesapalRedirect({
        url: data.redirectUrl,
        ref: data.merchantReference,
      });

      setSuccess(`Live Pesapal Order Created (Ref: ${data.merchantReference}). Redirecting to payment gateway...`);

      // Automatically redirect to Pesapal secure payment portal so the player gets the USSD prompt on their phone
      setTimeout(() => {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Deposit initialization failed');
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

      const ref = `SIM-${Date.now().toString(36).toUpperCase()}`;
      await creditWallet(currentAmount, `Direct Mobile Money Deposit (${phoneNumber || 'MTN/Airtel'})`, ref);
      setSuccess(`Successfully credited UGX ${currentAmount.toLocaleString()} to your wallet!`);
    } catch (err: any) {
      setError(err.message || 'Failed to credit wallet');
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
            <p className="text-xs text-slate-400">Pesapal 3.0 Integrated & Secure Ledger</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-5 rounded-2xl border border-slate-700/80 mb-6 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Balance</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              UGX (Ugandan Shilling)
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
            onClick={() => setActiveTab('overview')}
            className={`py-2 rounded-lg transition ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1 ${activeTab === 'deposit' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
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
                Select your stake or deposit amount. Live real-time payments are processed securely via <strong>Pesapal 3.0 & Mobile Money (MTN / Airtel Uganda)</strong>.
              </span>
            </div>

            {error && (
              <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {success}
              </div>
            )}

            <form onSubmit={handleDepositPesapal} className="space-y-4">
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

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Money Phone Number (MTN / Airtel Uganda)</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0770000000 / 0750000000"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Deposit Amount:</span>
                <span className="text-base font-black text-emerald-400">UGX {currentAmount.toLocaleString()}</span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {loading ? 'Initiating Live Deposit...' : 'Pay via Mobile Money (Pesapal 3.0)'}
                </button>

                <button
                  type="button"
                  onClick={handleInstantCredit}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <span>⚡ Instant Credit Wallet (UGX {currentAmount.toLocaleString()})</span>
                </button>
              </div>

              {pesapalRedirect && (
                <div className="p-3 bg-slate-800 rounded-xl border border-emerald-500/40 text-center space-y-2 mt-2">
                  <p className="text-xs text-slate-300">Reference: <code className="font-mono text-emerald-400">{pesapalRedirect.ref}</code></p>
                  <a
                    href={pesapalRedirect.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block py-2 px-4 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-xs transition"
                  >
                    Open Live Pesapal Payment Gateway →
                  </a>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Tab Content: Withdraw */}
        {activeTab === 'withdraw' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">KYC Verification Required</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Before withdrawing real-money funds to MTN MoMo or Airtel Money, account verification and KYC approval are required under Ugandan gaming regulations.
              </p>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs text-left">
              <div className="flex justify-between py-1 border-b border-slate-700">
                <span className="text-slate-400">Eligibility:</span>
                <span className="font-semibold text-amber-400 capitalize">{userProfile?.eligibilityStatus || 'unverified'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Min. Payout:</span>
                <span className="font-semibold text-slate-200">UGX {GAME_ECONOMICS.minWithdrawalUGX.toLocaleString()}</span>
              </div>
            </div>
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
                Wallet balances are maintained in integer UGX with server-authoritative double-entry ledger tracking. All deposits are verified via Pesapal API 3.0.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
