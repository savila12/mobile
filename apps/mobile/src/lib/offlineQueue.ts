import NetInfo from '@react-native-community/netinfo';

import { OfflineOperation } from '../types/models';
import { keys, readCache, writeCache } from './storage';

const getQueue = async (): Promise<OfflineOperation[]> => {
  return (await readCache<OfflineOperation[]>(keys.queue)) || [];
};

export const enqueueOperation = async (operation: OfflineOperation): Promise<void> => {
  const queue = await getQueue();
  queue.push(operation);
  await writeCache(keys.queue, queue);
};

export const clearQueue = async (): Promise<void> => {
  await writeCache(keys.queue, []);
};

export const flushQueue = async (
  executor: (operation: OfflineOperation) => Promise<void>,
): Promise<number> => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    return 0;
  }

  const queue = await getQueue();

  if (!queue.length) {
    return 0;
  }

  const remaining: OfflineOperation[] = [];
  let processed = 0;

  for (const operation of queue) {
    try {
      await executor(operation);
      processed += 1;
    } catch {
      remaining.push(operation);
    }
  }

  await writeCache(keys.queue, remaining);
  return processed;
};
