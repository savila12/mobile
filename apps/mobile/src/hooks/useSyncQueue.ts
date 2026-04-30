import { useEffect } from 'react';

import NetInfo from '@react-native-community/netinfo';

import { executeOfflineOperation } from '../lib/api';
import { flushQueue } from '../lib/offlineQueue';

export const useSyncQueue = () => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        return;
      }

      flushQueue(executeOfflineOperation).catch(() => {
        // Queue will be retried on the next reconnect.
      });
    });

    flushQueue(executeOfflineOperation).catch(() => {
      // No-op.
    });

    return () => {
      unsubscribe();
    };
  }, []);
};
