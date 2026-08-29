import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection } from 'firebase/firestore';
import { auth, db } from '../services/firebaseClient';
import { UserProfileDoc, WalletDoc, WalletTransactionDoc, GAME_ECONOMICS } from '../types/platform';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileDoc | null;
  wallet: WalletDoc | null;
  loading: boolean;
  signInGuest: (displayName?: string) => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  creditWallet: (amount: number, description?: string, reference?: string) => Promise<void>;
  debitWallet: (amount: number, description?: string, reference?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDoc | null>(null);
  const [wallet, setWallet] = useState<WalletDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile & wallet upon Auth state change
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Listen to User Profile
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, async (snap) => {
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfileDoc);
          } else {
            // Initialize default profile
            const newProfile: UserProfileDoc = {
              id: currentUser.uid,
              username: currentUser.displayName || `Player_${currentUser.uid.slice(0, 5)}`,
              displayName: currentUser.displayName || 'Player',
              email: currentUser.email || undefined,
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
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        });

        // Listen to Wallet
        const walletRef = doc(db, 'wallets', currentUser.uid);
        const unsubscribeWallet = onSnapshot(walletRef, (snap) => {
          if (snap.exists()) {
            setWallet(snap.data() as WalletDoc);
          } else {
            // Initial read-only representation for newly created accounts
            setWallet({
              userId: currentUser.uid,
              availableBalance: 0,
              lockedBalance: 0,
              currency: GAME_ECONOMICS.currency,
              status: 'active',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        });

        setLoading(false);
        return () => {
          unsubscribeProfile();
          unsubscribeWallet();
        };
      } else {
        setUserProfile(null);
        setWallet(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signInGuest = async (displayName?: string) => {
    setLoading(true);
    try {
      const res = await signInAnonymously(auth);
      if (displayName) {
        await updateProfile(res.user, { displayName });
      }
    } finally {
      setLoading(false);
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const signUpEmail = async (email: string, pass: string, username: string) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(res.user, { displayName: username });
    } finally {
      setLoading(false);
    }
  };

  const creditWallet = async (amount: number, description?: string, reference?: string) => {
    if (amount <= 0) return;
    const currentUid = user?.uid || 'guest_user';
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

    if (user) {
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

    const currentUid = user?.uid || 'guest_user';
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

    if (user) {
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
    await fbSignOut(auth);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      setUserProfile(snap.data() as UserProfileDoc);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        wallet,
        loading,
        signInGuest,
        signInEmail,
        signUpEmail,
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
