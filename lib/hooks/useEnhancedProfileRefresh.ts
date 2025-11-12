// Enhanced hook that refreshes on multiple events
import { useEffect, useRef } from 'react';
import { useAuthStore, fetchUserProfile } from '@/lib/store/auth-store';

export const useEnhancedProfileRefresh = () => {
  const { user, updateUser, setLoading } = useAuthStore();
  const lastRefreshRef = useRef<number>(0);
  const refreshCooldown = 30000; // 30 seconds cooldown

  const refreshProfile = async (reason: string) => {
    if (!user?.auth_token) return;

    const now = Date.now();
    if (now - lastRefreshRef.current < refreshCooldown) {
     // console.log(`⏰ Profile refresh skipped (${reason}) - cooldown active`);
      return;
    }

    try {
      // console.log(`🔄 Refreshing profile data (${reason})...`);
      setLoading(true);
      lastRefreshRef.current = now;
      
      const profileData = await fetchUserProfile(user.auth_token);
      if (profileData) {
        updateUser({
          fullname: profileData.fullname,
          dp: profileData.dp,
          walletBalance: profileData.walletBalance,
          locked_amount: profileData.locked_amount,
          unlocked_amount: profileData.unlocked_amount,
          kycStatus: profileData.kycStatus,
          isBlocked: profileData.isBlocked,
          mailPrefix: profileData.mailPrefix,
        });
       // console.log('✅ Profile data refreshed successfully');
      }
    } catch (error) {
      console.error(`Error refreshing profile (${reason}):`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refresh on mount
    refreshProfile('mount');

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProfile('tab focus');
      }
    };

    // Refresh when window gains focus
    const handleWindowFocus = () => {
      refreshProfile('window focus');
    };

    // Refresh when coming back online
    const handleOnline = () => {
      refreshProfile('back online');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [user?.auth_token]);
};
