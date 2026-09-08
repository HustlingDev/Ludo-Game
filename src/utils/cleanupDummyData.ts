/**
 * Clean up legacy dummy player data and initialize real-time environment.
 */
export function initializeCleanRealtimeData(): void {
  try {
    const CLEANUP_KEY = 'ludo_realtime_reset_v2';
    if (!localStorage.getItem(CLEANUP_KEY)) {
      // Keys to completely wipe
      const keysToClear = [
        'ludo_user_stats',
        'ludo_user_history',
        'ludo_game_history',
        'ludo_user_friends',
        'ludo_user_requests',
        'ludo_active_match',
        'ludo_wallet_data',
        'ludo_room_id',
      ];

      keysToClear.forEach((key) => localStorage.removeItem(key));

      // Reset local wallet to 200 UGX welcome bonus
      const walletRaw = localStorage.getItem('ludo_user_wallet');
      if (walletRaw) {
        try {
          const w = JSON.parse(walletRaw);
          w.availableBalance = 200;
          w.lockedBalance = 0;
          localStorage.setItem('ludo_user_wallet', JSON.stringify(w));
        } catch {
          localStorage.removeItem('ludo_user_wallet');
        }
      }

      localStorage.setItem(CLEANUP_KEY, 'true');
      console.log('Real-time data clean reset performed. Welcome bonus active (200 UGX).');
    }
  } catch (e) {
    console.warn('Failed to clean dummy data:', e);
  }
}
