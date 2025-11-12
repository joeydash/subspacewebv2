import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  wasOffline: boolean;
}
export const useNetworkStatus = (): NetworkStatus => {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [connectionType, setConnectionType] = useState('unknown');
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // User came back online, reload the page if they were on error page
        if (window.location.pathname === '/error') {
          window.location.reload();
        }
        setWasOffline(false);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      // Immediately redirect to error page when going offline
      router.replace(`/error?type=network&message=${encodeURIComponent('You are currently offline. Please check your internet connection.')}&canRetry=true`);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection speed if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
        setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
        
        const handleConnectionChange = () => {
          setConnectionType(connection.effectiveType || 'unknown');
          setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
        };
        
        connection.addEventListener('change', handleConnectionChange);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          connection.removeEventListener('change', handleConnectionChange);
        };
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router, wasOffline]);

  return { isOnline, isSlowConnection, connectionType, wasOffline };
};