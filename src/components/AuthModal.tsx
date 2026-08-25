import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Shield, UserCheck, X, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, signInGuest, signInEmail, signUpEmail, signOut, loading } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup' | 'guest'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tab === 'login') {
        await signInEmail(email, password);
        onClose();
      } else if (tab === 'signup') {
        if (!username.trim()) throw new Error('Username is required');
        await signUpEmail(email, password, username);
        onClose();
      } else if (tab === 'guest') {
        await signInGuest(username || 'Guest Player');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-3xl mx-auto">
              {userProfile?.avatar || '👤'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{userProfile?.displayName || user.displayName || 'Player'}</h2>
              <p className="text-sm text-slate-400">{user.email || 'Guest Account'}</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 text-xs flex justify-around border border-slate-700">
              <div>
                <span className="text-slate-400 block">Rating</span>
                <span className="font-semibold text-emerald-400">{userProfile?.rating || 1200}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Level</span>
                <span className="font-semibold text-amber-400">{userProfile?.level || 1}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Games Won</span>
                <span className="font-semibold text-blue-400">{userProfile?.gamesWon || 0}</span>
              </div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-rose-600/80 hover:bg-rose-600 font-medium rounded-xl transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-bold">Ludo Multiplayer Account</h2>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(null); }}
                className={`py-2 rounded-lg transition ${tab === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setError(null); }}
                className={`py-2 rounded-lg transition ${tab === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setTab('guest'); setError(null); }}
                className={`py-2 rounded-lg transition ${tab === 'guest' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Guest Play
              </button>
            </div>

            {error && (
              <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab !== 'login' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Username / Display Name</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. MasterLudo"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {tab !== 'guest' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {tab === 'login' && <LogIn className="w-4 h-4" />}
                {tab === 'signup' && <UserPlus className="w-4 h-4" />}
                {tab === 'guest' && <Sparkles className="w-4 h-4" />}
                {submitting ? 'Connecting...' : tab === 'login' ? 'Sign In' : tab === 'signup' ? 'Create Account' : 'Play as Guest'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
