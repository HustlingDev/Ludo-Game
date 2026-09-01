import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Smartphone, ShieldCheck, X, Sparkles, Check, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['👑', '⚡', '🐉', '🦁', '🚀', '🎯', '🔥', '💎', '🦊', '🐼', '🤖', '🎲'];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateUserProfile, signInGoogle, signOut } = useAuth();

  const [avatar, setAvatar] = useState(userProfile?.avatar || '👑');
  const [username, setUsername] = useState(userProfile?.username || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [usernameError, setUsernameError] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  if (!isOpen) return null;

  const handleUsernameChange = (val: string) => {
    const rawLower = val.toLowerCase();
    const sanitized = rawLower.replace(/[^a-z]/g, '');
    setUsername(sanitized);

    if (val !== sanitized) {
      setUsernameError('Only lowercase letters (a-z) allowed, no numbers or spaces');
    } else if (sanitized.length > 0 && sanitized.length < 3) {
      setUsernameError('Must be at least 3 letters');
    } else {
      setUsernameError('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanUsername.length < 3) {
      setUsernameError('Username must be at least 3 lowercase letters (no numbers)');
      return;
    }

    await updateUserProfile({
      username: cleanUsername,
      displayName: cleanUsername,
      phone: phone.trim(),
      avatar,
    });

    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Player Profile & Settings</h2>
            <p className="text-xs text-slate-400">Manage your avatar, username & mobile money number</p>
          </div>
        </div>

        {userProfile ? (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Player Avatar</span>
                <span className="text-xl">{avatar}</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => setAvatar(av)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-lg flex items-center justify-center transition ${
                      avatar === av
                        ? 'bg-amber-500 border border-amber-300 scale-105 shadow'
                        : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Username (Only lowercase letters, no numbers) */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1 flex items-center justify-between">
                <span>Username:</span>
                <span className="text-[10px] text-slate-400">only lowercase letters, no numbers</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="e.g. katoderrick"
                maxLength={15}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
              {usernameError && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{usernameError}</span>
                </p>
              )}
            </div>

            {/* Phone Number (Uganda) */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1 flex items-center justify-between">
                <span>Mobile Money Recipient Number:</span>
                <span className="text-[10px] text-emerald-400 font-bold">MTN / Airtel</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0772123456 or +256..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <Smartphone className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Withdrawals from your wallet will automatically be sent to this number.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition"
              >
                {savedMsg ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>

              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs rounded-xl border border-slate-700 transition"
              >
                Sign Out
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 space-y-4">
            <p className="text-xs text-slate-300">Sign in with your Google account to play real-money skill challenges.</p>
            <button
              onClick={() => signInGoogle()}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.15C3.25 21.37 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
