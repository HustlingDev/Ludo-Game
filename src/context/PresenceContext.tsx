import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface OnlinePlayer {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  stake?: number;
  playerCount?: number;
  status: 'available' | 'in_game';
  country?: string;
  lastSeen?: number;
}

interface PresenceContextType {
  totalOnline: number;
  onlinePlayers: OnlinePlayer[];
  refreshPresence: () => Promise<void>;
  updateCurrentStake: (stake: number | null, playerCount?: number) => void;
}

const PresenceContext = createContext<PresenceContextType>({
  totalOnline: 1,
  onlinePlayers: [],
  refreshPresence: async () => {},
  updateCurrentStake: () => {},
});

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, userRating } = useAuth();
  const [totalOnline, setTotalOnline] = useState<number>(1);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const stakeRef = useRef<number | null>(null);
  const playerCountRef = useRef<number>(2);

  const getClientId = useCallback(() => {
    let cid = sessionStorage.getItem('ludo_client_uid');
    if (!cid) {
      cid = `usr_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('ludo_client_uid', cid);
    }
    return userProfile?.name
      ? `usr_${userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      : cid;
  }, [userProfile?.name]);

  const sendHeartbeatAndFetch = useCallback(async () => {
    try {
      const clientId = getClientId();
      const name = userProfile?.name || 'Player';
      const avatar = userProfile?.avatar || 'avatar_braids';

      await fetch('/api/lobby/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clientId,
          name,
          avatar,
          rating: userRating || 1200,
          status: 'available',
          stake: stakeRef.current || undefined,
          playerCount: playerCountRef.current,
        }),
      });

      const res = await fetch('/api/lobby/players');
      const data = await res.json();
      if (data) {
        const rawCount = typeof data.totalOnline === 'number' ? data.totalOnline : (data.players?.length || 1);
        // Ensure at least 1 (the current player)
        const realCount = Math.max(1, rawCount);
        setTotalOnline(realCount);

        if (Array.isArray(data.players)) {
          // Filter out current player from opponent list
          const others = (data.players as OnlinePlayer[]).filter((p) => p.id !== clientId && p.name !== name);
          setOnlinePlayers(others);
        }
      }
    } catch {
      // Fallback network resilience
    }
  }, [getClientId, userProfile?.name, userProfile?.avatar, userRating]);

  const updateCurrentStake = useCallback((stake: number | null, count = 2) => {
    stakeRef.current = stake;
    playerCountRef.current = count;
    sendHeartbeatAndFetch();
  }, [sendHeartbeatAndFetch]);

  useEffect(() => {
    sendHeartbeatAndFetch();
    const interval = setInterval(sendHeartbeatAndFetch, 5000);

    const handleBeforeUnload = () => {
      try {
        const clientId = getClientId();
        const payload = JSON.stringify({ id: clientId });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/lobby/leave', new Blob([payload], { type: 'application/json' }));
        }
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sendHeartbeatAndFetch, getClientId]);

  return (
    <PresenceContext.Provider
      value={{
        totalOnline,
        onlinePlayers,
        refreshPresence: sendHeartbeatAndFetch,
        updateCurrentStake,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);
