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
  LogOut,
  Zap,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TermsOfServiceModal } from './TermsOfServiceModal';

interface GoogleAuthBottomSheetProps {
  isOpen: boolean;
  onSuccess?: () => void;
}

const AVATAR_OPTIONS = ['👑', '⚡', '🐉', '🦁', '🚀', '🎯', '🔥', '💎', '🦊', '🐼', '🤖', '🎲'];

export const GoogleAuthBottomSheet: React.FC<GoogleAuthBottomSheetProps> = ({
  isOpen,
  onSuccess,
}) => {
  const { user, userProfile, signInGoogle, updateUserProfile, signOut, isProfileComplete } = useAuth();

  // Profile Form state
  const [avatar, setAvatar] = useState<string>('👑');
  const [username, setUsername] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  // Initialize form values from user & profile
  useEffect(() => {
    if (userProfile) {
      if (userProfile.avatar) setAvatar(userProfile.avatar);
      if (userProfile.username && /^[a-z]+$/.test(userProfile.username)) {
        setUsername(userProfile.username);
      } else if (user?.displayName || user?.email) {
        const raw = (user.displayName || user.email?.split('@')[0] || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw) setUsername(raw);
      }
      if (userProfile.phone) setPhoneNumber(userProfile.phone);
      if (userProfile.termsAccepted) setTermsAccepted(true);
    } else if (user) {
      const raw = (user.displayName || user.email?.split('@')[0] || '').toLowerCase().replace(/[^a-z]/g, '');
      if (raw) setUsername(raw);
    }
  }, [user, userProfile]);

  // If already logged in and complete, trigger onSuccess
  useEffect(() => {
    if (isProfileComplete) {
      onSuccess?.();
    }
  }, [isProfileComplete, onSuccess]);

  if (!isOpen) return null;

  // Validate username: only lowercase English letters (a-z), no numbers or symbols
  const handleUsernameChange = (val: string) => {
    const rawLower = val.toLowerCase();
    const sanitized = rawLower.replace(/[^a-z]/g, '');
    setUsername(sanitized);

    if (val !== sanitized) {
      setUsernameError('Only lowercase letters (a-z) allowed, no numbers or symbols');
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
      setPhoneError('Please enter a valid Uganda Mobile Money number (MTN / Airtel)');
    } else {
      setPhoneError('');
    }
  };

  const handleGoogleSignInClick = async () => {
    setAuthError('');
    setIsSubmitting(true);
    try {
      await signInGoogle();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign in window was closed. Please try again.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setAuthError('Sign in process was cancelled.');
      } else if (err?.code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked by your browser. Please enable popups or tap sign in again.');
      } else {
        setAuthError(err?.message || 'Could not complete Google sign-in. Please try again.');
      }
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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-0 sm:p-4">
        {/* Bottom Sheet Modal Container */}
        <div className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-700/80 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[94vh]">
          {/* Top Pull Bar for Mobile */}
          <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-slate-700" />
          </div>

          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
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
                  {!user ? 'Sign in with Google' : 'Complete Player Profile'}
                </h2>
                <p className="text-xs text-slate-400">
                  {!user
                    ? 'Official sign up for Ludo Arena'
                    : 'Set your avatar, lowercase username & phone'}
                </p>
              </div>
            </div>

            {user && (
              <button
                type="button"
                onClick={() => signOut()}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 p-1.5 rounded-xl hover:bg-slate-800 transition"
                title="Switch Google Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Sign Out</span>
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            {!user ? (
              /* STEP 1: Official Google Sign Up / Sign In */
              <div className="space-y-4">
                <div className="text-center py-2 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] font-black text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Real-Money Skill Challenges • UGX Payouts</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Sign up with your Google Account
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto">
                    Authenticate securely with your Google profile to enter live matches and claim UGX prize earnings.
                  </p>
                </div>

                {/* Trust and Feature Bullets */}
                <div className="grid grid-cols-1 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>Secure Google OAuth 2.0 verified authentication</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span>Instant MTN & Airtel Mobile Money cash withdrawals</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <span>1v1 and 4-Player multiplayer rooms with live stakes</span>
                  </div>
                </div>

                {/* Error Banner */}
                {authError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Sign-in Error</p>
                      <p className="text-[11px] text-rose-300/90">{authError}</p>
                    </div>
                  </div>
                )}

                {/* Prominent Google Sign-in Button */}
                <button
                  id="google-sign-in-button"
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl transition border border-slate-200"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
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
                  <span>{isSubmitting ? 'Signing in with Google...' : 'Sign in with Google'}</span>
                </button>

                <p className="text-[11px] text-center text-slate-500">
                  By clicking Sign in with Google, you agree to our 18+ policy and terms.
                </p>
              </div>
            ) : (
              /* STEP 2: Complete Real Google User Profile */
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Verified Google Account Pill */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Google Avatar"
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full border border-slate-700 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {user.displayName || 'Google User'}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 truncate">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="text-[11px] text-slate-400 hover:text-rose-400 font-bold px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 shrink-0 transition"
                  >
                    Change
                  </button>
                </div>

                {/* 1. Choose Avatar */}
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>1. Choose Match Avatar:</span>
                    <span className="text-xl">{avatar}</span>
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
                    <span>2. Username (Lowercase letters only):</span>
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
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{usernameError}</span>
                    </p>
                  )}
                </div>

                {/* 3. Phone Number for Mobile Money */}
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1 flex items-center justify-between">
                    <span>3. Uganda Phone Number:</span>
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
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{phoneError}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Used for verified UGX Mobile Money withdrawals and match winnings.
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
