import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection } from 'firebase/firestore';
import { auth, db } from '../services/firebaseClient';
import { UserProfileDoc, WalletDoc, WalletTransactionDoc, GAME_ECONOMICS } from '../types/platform';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileDoc | null;
  wallet: WalletDoc | null;
  loading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  signInGoogle: () => Promise<void>;
  signInGoogleRedirect: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfileDoc>) => Promise<void>;
  updatePhoneNumber: (phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  creditWallet: (amount: number, description?: string, reference?: string) => Promise<void>;
  debitWallet: (amount: number, description?: string, reference?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_PROFILE_KEY = 'ludo_active_user_profile';
const LOCAL_WALLET_KEY = 'ludo_active_wallet';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDoc | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [wallet, setWallet] = useState<WalletDoc | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_WALLET_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Computed auth states
  const isAuthenticated = Boolean(user && user.uid);
  const isProfileComplete = Boolean(
    userProfile &&
      userProfile.username &&
      userProfile.username.length >= 3 &&
      /^[a-z]+$/.test(userProfile.username) &&
      userProfile.phone &&
      userProfile.phone.trim().length >= 9 &&
      userProfile.termsAccepted
  );

  // Sync user profile & wallet upon Auth state change
  useEffect(() => {
    // Check if coming back from a redirect flow
    getRedirectResult(auth).catch((err) => {
      console.warn('Redirect auth result check:', err);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Listen to User Profile in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeProfile = onSnapshot(
          userRef,
          async (snap) => {
            if (snap.exists()) {
              const data = snap.data() as UserProfileDoc;
              setUserProfile(data);
              localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(data));
            } else {
              // Extract lowercase clean username from displayName or email
              const rawName = currentUser.displayName || currentUser.email?.split('@')[0] || '';
              const cleanUsername = rawName.toLowerCase().replace(/[^a-z]/g, '');

              const newProfile: UserProfileDoc = {
                id: currentUser.uid,
                username: cleanUsername,
                displayName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Player'),
                email: currentUser.email || undefined,
                phone: currentUser.phoneNumber || undefined,
                avatar: '👑',
                level: 1,
                xp: 0,
                rating: 1200,
                gamesPlayed: 0,
                gamesWon: 0,
                termsAccepted: false,
                ageConfirmed: false,
                diceSkin: 'classic_ivory',
                status: 'active',
                eligibilityStatus: 'unverified',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              try {
                await setDoc(userRef, newProfile, { merge: true });
              } catch (err) {
                console.warn('Could not write initial profile to Firestore:', err);
              }
              setUserProfile(newProfile);
              localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
            }
          },
          (err) => {
            console.warn('Firestore profile snapshot error:', err);
          }
        );

        // Listen to Wallet in Firestore
        const walletRef = doc(db, 'wallets', currentUser.uid);
        const unsubscribeWallet = onSnapshot(
          walletRef,
          async (snap) => {
            if (snap.exists()) {
              const data = snap.data() as WalletDoc;
              setWallet(data);
              localStorage.setItem(LOCAL_WALLET_KEY, JSON.stringify(data));
            } else {
              const initialWallet: WalletDoc = {
                userId: currentUser.uid,
                availableBalance: 2000, // Welcome bonus UGX 2,000 to test matches
                lockedBalance: 0,
                currency: GAME_ECONOMICS.currency,
                status: 'active',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              try {
                await setDoc(walletRef, initialWallet, { merge: true });
              } catch (err) {
                console.warn('Could not initialize wallet in Firestore:', err);
              }
              setWallet(initialWallet);
              localStorage.setItem(LOCAL_WALLET_KEY, JSON.stringify(initialWallet));
            }
          },
          (err) => {
            console.warn('Firestore wallet snapshot error:', err);
          }
        );

        setLoading(false);
        return () => {
          unsubscribeProfile();
          unsubscribeWallet();
        };
      } else {
        setUserProfile(null);
        setWallet(null);
        localStorage.removeItem(LOCAL_PROFILE_KEY);
        localStorage.removeItem(LOCAL_WALLET_KEY);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signInGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setUser(result.user);
      }
    } catch (err: any) {
      console.error('Firebase Google sign-in popup error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInGoogleRedirect = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error('Firebase Google sign-in redirect error:', err);
      setLoading(false);
      throw err;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfileDoc>) => {
    const activeUid = user?.uid || userProfile?.id;
    if (!activeUid) return;

    const updated: UserProfileDoc = {
      ...(userProfile || {
        id: activeUid,
        username: '',
        displayName: user?.displayName || 'Player',
        email: user?.email || undefined,
        avatar: '👑',
        level: 1,
        xp: 0,
        rating: 1200,
        gamesPlayed: 0,
        gamesWon: 0,
        status: 'active',
        eligibilityStatus: 'unverified',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
      ...data,
      updatedAt: Date.now(),
    };

    // Ensure username is strictly lowercase English letters
    if (data.username !== undefined) {
      updated.username = data.username.toLowerCase().replace(/[^a-z]/g, '');
    }

    setUserProfile(updated);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));

    try {
      const userRef = doc(db, 'users', activeUid);
      await setDoc(userRef, updated, { merge: true });
    } catch (err) {
      console.warn('Could not update profile in Firestore:', err);
    }
  };

  const updatePhoneNumber = async (phone: string) => {
    await updateUserProfile({ phone });
  };

  const creditWallet = async (amount: number, description?: string, reference?: string) => {
    if (amount <= 0) return;
    const currentUid = user?.uid || userProfile?.id || 'usr_active';
    const currentAvailable = wallet?.availableBalance || 0;
    const newBalance = currentAvailable + amount;
    const updatedWallet: WalletDoc = {
      userId: currentUid,
      availableBalance: newBalance,
      lockedBalance: wallet?.lockedBalance || 0,
      currency: GAME_ECONOMICS.currency,
      status: 'active',
      createdAt: wallet?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    setWallet(updatedWallet);
    localStorage.setItem(LOCAL_WALLET_KEY, JSON.stringify(updatedWallet));

    if (user?.uid) {
      try {
        const walletRef = doc(db, 'wallets', user.uid);
        await setDoc(walletRef, updatedWallet, { merge: true });

        const txRef = doc(collection(db, 'walletTransactions'));
        const txDoc: WalletTransactionDoc = {
          id: txRef.id,
          userId: user.uid,
          type: 'deposit',
          amount,
          currency: 'UGX',
          reference: reference || `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          status: 'completed',
          createdAt: Date.now(),
          metadata: { description: description || 'UGX Wallet Deposit' },
        };
        await setDoc(txRef, txDoc);
      } catch (err) {
        console.warn('Firestore wallet update failed, kept in memory state:', err);
      }
    }
  };

  const debitWallet = async (amount: number, description?: string, reference?: string): Promise<boolean> => {
    if (amount <= 0) return true;
    const currentAvailable = wallet?.availableBalance || 0;
    if (currentAvailable < amount) return false;

    const currentUid = user?.uid || userProfile?.id || 'usr_active';
    const newBalance = currentAvailable - amount;
    const updatedWallet: WalletDoc = {
      userId: currentUid,
      availableBalance: newBalance,
      lockedBalance: wallet?.lockedBalance || 0,
      currency: GAME_ECONOMICS.currency,
      status: 'active',
      createdAt: wallet?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    setWallet(updatedWallet);
    localStorage.setItem(LOCAL_WALLET_KEY, JSON.stringify(updatedWallet));

    if (user?.uid) {
      try {
        const walletRef = doc(db, 'wallets', user.uid);
        await setDoc(walletRef, updatedWallet, { merge: true });

        const txRef = doc(collection(db, 'walletTransactions'));
        const txDoc: WalletTransactionDoc = {
          id: txRef.id,
          userId: user.uid,
          type: 'gameEntry',
          amount: -amount,
          currency: 'UGX',
          reference: reference || `STK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          status: 'completed',
          createdAt: Date.now(),
          metadata: { description: description || 'UGX Stake Lock' },
        };
        await setDoc(txRef, txDoc);
      } catch (err) {
        console.warn('Firestore debit error, kept in local state:', err);
      }
    }

    return true;
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    localStorage.removeItem(LOCAL_WALLET_KEY);
    setUserProfile(null);
    setWallet(null);
    try {
      await fbSignOut(auth);
    } catch {
      // Ignore
    }
  };

  const refreshProfile = async () => {
    if (!user?.uid) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data() as UserProfileDoc;
        setUserProfile(data);
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Error refreshing profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        wallet,
        loading,
        isAuthenticated,
        isProfileComplete,
        signInGoogle,
        signInGoogleRedirect,
        updateUserProfile,
        updatePhoneNumber,
        signOut,
        refreshProfile,
        creditWallet,
        debitWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
