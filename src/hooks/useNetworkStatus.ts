import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const updateOnlineStatus = () => {
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
        setIsConnected(online);
        setIsInternetReachable(online);
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
      }
      updateOnlineStatus();

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('online', updateOnlineStatus);
          window.removeEventListener('offline', updateOnlineStatus);
        }
      };
    }

    // Native platforms (Android / iOS)
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // On native or web, offline strictly means not connected
  const isOffline = !isConnected;
  return { isConnected, isInternetReachable, isOffline };
};
