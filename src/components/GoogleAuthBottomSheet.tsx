import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  User,
  Sparkles,
  Lock,
  FileText,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TermsOfServiceModal } from './TermsOfServiceModal';

interface GoogleAuthBottomSheetProps {
  isOpen: boolean;
  onSuccess?: () => void;
}

const AVATAR_OPTIONS = ['👑', '⚡', '🐉', '🦁', '🚀', '🎯', '🔥', '💎', '🦊', '🐼', '🤖', '🎲'];

// Simulated Google accounts detected on Android / Mobile browser device
const DEVICE_ACCOUNTS = [
  {
    name: 'Kato Derrick',
    email: 'kato.derrick99@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    initial: 'K',
    bgColor: 'bg-emerald-600',
  },
  {
    name: 'Sarah Namubiru',
    email: 'sarah.namubiru@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    initial: 'S',
    bgColor: 'bg-indigo-600',
  },
  {
    name: 'Uganda Player',
    email: 'player.uganda@gmail.com',
    avatar: '',
    initial: 'U',
    bgColor: 'bg-amber-600',
  },
];

export const GoogleAuthBottomSheet: React.FC<GoogleAuthBottomSheetProps> = ({
  isOpen,
  onSuccess,
}) => {
  const { userProfile, selectDeviceGoogleAccount, signInGoogle, updateUserProfile } = useAuth();

  const [step, setStep] = useState<'account_picker' | 'profile_setup'>('account_picker');
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // Profile Form state
  const [avatar, setAvatar] = useState<string>('👑');
  const [username, setUsername] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile?.email) {
      setSelectedEmail(userProfile.email);
      setSelectedName(userProfile.displayName || userProfile.email.split('@')[0]);
      if (userProfile.avatar) setAvatar(userProfile.avatar);
      if (userProfile.username && /^[a-z]+$/.test(userProfile.username)) {
        setUsername(userProfile.username);
      }
      if (userProfile.phone) setPhoneNumber(userProfile.phone);
      if (userProfile.termsAccepted) setTermsAccepted(true);

      // If user profile is already fully initialized with valid username, phone & terms, skip to finished
      if (
        userProfile.username &&
        /^[a-z]+$/.test(userProfile.username) &&
        userProfile.phone &&
        userProfile.termsAccepted
      ) {
        onSuccess?.();
      } else {
        setStep('profile_setup');
      }
    }
  }, [userProfile]);

  if (!isOpen) return null;

  // Validate username: only lowercase English letters (a-z), no numbers or symbols
  const handleUsernameChange = (val: string) => {
    const rawLower = val.toLowerCase();
    const sanitized = rawLower.replace(/[^a-z]/g, '');
    setUsername(sanitized);

    if (val !== sanitized) {
      setUsernameError('Only lowercase letters are allowed (no numbers or special characters)');
    } else if (sanitized.length > 0 && sanitized.length < 3) {
      setUsernameError('Username must be at least 3 letters');
    } else if (sanitized.length > 15) {
      setUsernameError('Username cannot exceed 15 letters');
    } else {
      setUsernameError('');
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    const cleaned = val.replace(/[^0-9+]/g, '');
    if (cleaned.length < 9) {
      setPhoneError('Please enter a valid Uganda Mobile Money phone number');
    } else {
      setPhoneError('');
    }
  };

  const handleSelectAccount = async (email: string, name: string) => {
    setSelectedEmail(email);
    setSelectedName(name);

    // Derive initial lowercase username from email/name
    const initialLower = (name || email.split('@')[0]).toLowerCase().replace(/[^a-z]/g, '') || 'player';
    setUsername(initialLower);

    await selectDeviceGoogleAccount(email, name);
    setStep('profile_setup');
  };

  const handleRealGooglePopup = async () => {
    try {
      setIsSubmitting(true);
      await signInGoogle();
      setStep('profile_setup');
    } catch (e) {
      console.warn('Popup failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      alert('You must accept the Terms of Service and confirm you are 18+ to continue.');
      return;
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanUsername.length < 3) {
      setUsernameError('Username must be at least 3 lowercase letters (no numbers).');
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 9) {
      setPhoneError('Please enter your Mobile Money phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserProfile({
        username: cleanUsername,
        displayName: cleanUsername,
        phone: phoneNumber.trim(),
        avatar,
        termsAccepted: true,
        ageConfirmed: true,
      });

      onSuccess?.();
    } catch (err: any) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
        {/* Bottom Sheet Modal Container */}
        <div className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-700 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[92vh]">
          {/* Top Decorative Pull Bar for Mobile */}
          <div className="w-full pt-3 pb-1 flex justify-center sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-slate-700" />
          </div>

          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
            {/* Google G Logo Badge */}
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md p-2 shrink-0">
              <svg viewBox="0 0 24 24" className="w-full h-full">
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
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white leading-tight">
                {step === 'account_picker' ? 'Sign in with Google' : 'Complete Player Profile'}
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'account_picker'
                  ? 'Choose an account to enter Ludo Arena'
                  : 'Set your avatar, lowercase username & phone'}
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            {step === 'account_picker' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 font-medium">
                  Select a Google account associated with this device:
                </p>

                {/* Device Accounts List */}
                <div className="space-y-2">
                  {DEVICE_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleSelectAccount(acc.email, acc.name)}
                      className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 flex items-center justify-between text-left transition group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${acc.bgColor}`}
                        >
                          {acc.initial}
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-400 transition">
                            {acc.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{acc.email}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                    </button>
                  ))}
                </div>

                {/* Custom Google Account Input / Popup */}
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-slate-500 flex items-center justify-center gap-2 text-xs font-bold text-slate-300 transition"
                  >
                    <Plus className="w-4 h-4 text-slate-400" />
                    <span>Use another Google account</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Enter your Google Email:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => {
                          if (customEmail.includes('@')) {
                            handleSelectAccount(customEmail, customEmail.split('@')[0]);
                          }
                        }}
                        disabled={!customEmail.includes('@')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl disabled:opacity-50"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                )}

                {/* Direct Google Popup Sign In */}
                <button
                  onClick={handleRealGooglePopup}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
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
                  <span>Continue with Google Browser Window</span>
                </button>
              </div>
            ) : (
              /* Step 2: Profile setup form */
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Account info pill */}
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Google Account:</span>
                    <span className="text-xs font-mono font-bold text-amber-400 truncate max-w-[180px]">
                      {selectedEmail}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('account_picker')}
                    className="text-[11px] text-sky-400 hover:underline font-bold"
                  >
                    Change
                  </button>
                </div>

                {/* 1. Choose Avatar */}
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <span>Choose Your Game Avatar:</span>
                    <span className="text-amber-400">{avatar}</span>
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        type="button"
                        key={av}
                        onClick={() => setAvatar(av)}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-xl flex items-center justify-center transition ${
                          avatar === av
                            ? 'bg-amber-500 border-2 border-amber-300 scale-105 shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Username (Only lowercase letters, no numbers) */}
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1 flex items-center justify-between">
                    <span>Username (Lowercase letters only):</span>
                    <span className="text-[10px] text-slate-400 font-normal">no numbers allowed</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="e.g. katoderrick"
                      maxLength={15}
                      required
                      className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-2xl text-xs sm:text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none transition ${
                        usernameError
                          ? 'border-rose-500 focus:border-rose-400'
                          : 'border-slate-700 focus:border-amber-500'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                      @{username || 'user'}
                    </div>
                  </div>
                  {usernameError && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      <span>{usernameError}</span>
                    </p>
                  )}
                </div>

                {/* 3. Phone Number for Mobile Money */}
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1 flex items-center justify-between">
                    <span>Uganda Phone Number:</span>
                    <span className="text-[10px] text-emerald-400 font-bold">MTN / Airtel Uganda</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="0772123456 or +256..."
                      required
                      className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-2xl text-xs sm:text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none transition ${
                        phoneError
                          ? 'border-rose-500 focus:border-rose-400'
                          : 'border-slate-700 focus:border-amber-500'
                      }`}
                    />
                    <Smartphone className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {phoneError ? (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      <span>{phoneError}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Used for verified UGX Mobile Money withdrawals and match challenges.
                    </p>
                  )}
                </div>

                {/* 4. 18+ Notice and Terms of Service Agreement */}
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-black">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-[10px]">
                      🔞 18+ REQUIREMENT
                    </span>
                    <span>You must be 18 years of age or older</span>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 mt-0.5 bg-slate-900 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-300 leading-snug">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }}
                        className="text-amber-400 underline font-bold hover:text-amber-300"
                      >
                        Terms & Conditions of Service
                      </button>{' '}
                      and certify that I am at least 18 years old.
                    </div>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !termsAccepted ||
                    username.length < 3 ||
                    Boolean(usernameError) ||
                    phoneNumber.length < 9
                  }
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving Profile...' : 'Complete & Enter Game Lobby'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Full Terms of Service Modal */}
      <TermsOfServiceModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
};
