import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection } from 'firebase/firestore';
import { auth, db } from '../services/firebaseClient';
import { UserProfileDoc, WalletDoc, WalletTransactionDoc, GAME_ECONOMICS, DiceSkin } from '../types/platform';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileDoc | null;
  wallet: WalletDoc | null;
  loading: boolean;
  signInGoogle: (accountEmail?: string, displayName?: string, photoURL?: string) => Promise<void>;
  selectDeviceGoogleAccount: (email: string, name: string, photoURL?: string) => Promise<void>;
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

  // Sync user profile & wallet upon Auth state change
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Listen to User Profile
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
              const rawName = currentUser.displayName || currentUser.email?.split('@')[0] || 'player';
              const cleanUsername = rawName.toLowerCase().replace(/[^a-z]/g, '') || 'player';

              const newProfile: UserProfileDoc = {
                id: currentUser.uid,
                username: cleanUsername,
                displayName: currentUser.displayName || cleanUsername,
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
                await setDoc(userRef, newProfile);
              } catch (err) {
                console.warn('Could not write profile to Firestore:', err);
              }
              setUserProfile(newProfile);
              localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
            }
          },
          (err) => {
            console.warn('Firestore profile snapshot error:', err);
          }
        );

        // Listen to Wallet
        const walletRef = doc(db, 'wallets', currentUser.uid);
        const unsubscribeWallet = onSnapshot(
          walletRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as WalletDoc;
              setWallet(data);
              localStorage.setItem(LOCAL_WALLET_KEY, JSON.stringify(data));
            } else {
              const initialWallet: WalletDoc = {
                userId: currentUser.uid,
                availableBalance: 0,
                lockedBalance: 0,
                currency: GAME_ECONOMICS.currency,
                status: 'active',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
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
        // Keep local profile if guest/demo signin occurred
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signInGoogle = async (accountEmail?: string, displayName?: string, photoURL?: string) => {
    setLoading(true);
    try {
      if (accountEmail) {
        await selectDeviceGoogleAccount(accountEmail, displayName || accountEmail.split('@')[0], photoURL);
        return;
      }

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setUser(result.user);
      }
    } catch (err: any) {
      console.warn('Firebase popup sign-in fallback:', err);
      // If popup fails or is blocked in iframe sandbox, use simulated Google account
      const fallbackEmail = accountEmail || 'player.uganda@gmail.com';
      await selectDeviceGoogleAccount(fallbackEmail, displayName || fallbackEmail.split('@')[0], photoURL);
    } finally {
      setLoading(false);
    }
  };

  const selectDeviceGoogleAccount = async (email: string, name: string, photoURL?: string) => {
    setLoading(true);
    try {
      // Try anonymous auth or create a session UID
      let uid = user?.uid;
      if (!uid) {
        try {
          const res = await signInAnonymously(auth);
          uid = res.user.uid;
        } catch {
          uid = `usr_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        }
      }

      const cleanUsername = name.toLowerCase().replace(/[^a-z]/g, '') || email.split('@')[0].toLowerCase().replace(/[^a-z]/g, '') || 'player';

      const existing = userProfile;
      const updatedProfile: UserProfileDoc = {
        id: uid,
        username: existing?.username && /^[a-z]+$/.test(existing.username) ? existing.username : cleanUsername,
        displayName: name || cleanUsername,
        email,
        phone: existing?.phone || undefined,
        avatar: existing?.avatar || '👑',
        level: existing?.level || 1,
        xp: existing?.xp || 0,
        rating: existing?.rating || 1200,
        gamesPlayed: existing?.gamesPlayed || 0,
        gamesWon: existing?.gamesWon || 0,
        termsAccepted: existing?.termsAccepted ?? false,
        ageConfirmed: existing?.ageConfirmed ?? false,
        diceSkin: existing?.diceSkin || 'classic_ivory',
        status: 'active',
        eligibilityStatus: 'unverified',
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      setUserProfile(updatedProfile);
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updatedProfile));

      if (!wallet) {
        const initialWallet: WalletDoc = {
          userId: uid,
          availableBalance: 2000, // Welcome bonus UGX 2,000 to test games
          lockedBalance: 0,
          currency: GAME_ECONOMICS.currency,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setWallet(initialWallet);
        localStorage.setItem(LOCAL_WALLET_KEY, JSON.stringify(initialWallet));
      }

      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, updatedProfile, { merge: true });
      } catch (e) {
        console.warn('Failed to sync to firestore:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfileDoc>) => {
    if (!userProfile) return;
    const updated: UserProfileDoc = {
      ...userProfile,
      ...data,
      updatedAt: Date.now(),
    };

    // Ensure username is strictly lowercase English letters
    if (data.username !== undefined) {
      updated.username = data.username.toLowerCase().replace(/[^a-z]/g, '');
    }

    setUserProfile(updated);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));

    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { ...data, updatedAt: Date.now() });
      } catch (err) {
        console.warn('Could not update profile in Firestore:', err);
      }
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
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    setUserProfile(null);
    try {
      await fbSignOut(auth);
    } catch {
      // Ignore
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
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
        signInGoogle,
        selectDeviceGoogleAccount,
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
