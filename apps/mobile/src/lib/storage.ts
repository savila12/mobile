import AsyncStorage from '@react-native-async-storage/async-storage';

const prefix = 'autotrack';

export const keys = {
  vehicles: (userId: string) => `${prefix}:vehicles:${userId}`,
  fuelLogs: (vehicleId: string) => `${prefix}:fuelLogs:${vehicleId}`,
  tasks: (vehicleId: string) => `${prefix}:tasks:${vehicleId}`,
  serviceHistory: (vehicleId: string) => `${prefix}:history:${vehicleId}`,
  queue: `${prefix}:offlineQueue`,
};

export const readCache = async <T>(key: string): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const writeCache = async <T>(key: string, value: T): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};
