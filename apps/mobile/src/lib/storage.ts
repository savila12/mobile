import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const prefix = 'autotrack';
const securePrefix = `${prefix}:secure`;
const secureChunkSize = 1800;

export const keys = {
  vehicles: (userId: string) => `${prefix}:vehicles:${userId}`,
  fuelLogs: (vehicleId: string) => `${prefix}:fuelLogs:${vehicleId}`,
  tasks: (vehicleId: string) => `${prefix}:tasks:${vehicleId}`,
  serviceHistory: (vehicleId: string) => `${prefix}:history:${vehicleId}`,
  queue: `${prefix}:offlineQueue`,
};

const sensitivePrefixes = [`${prefix}:vehicles:`, `${prefix}:fuelLogs:`, `${prefix}:tasks:`, `${prefix}:history:`];

const secureSingleKey = (key: string): string => `${securePrefix}:single:${key}`;
const secureMetaKey = (key: string): string => `${securePrefix}:meta:${key}`;
const secureChunkKey = (key: string, index: number): string => `${securePrefix}:chunk:${key}:${index}`;

const isSensitiveKey = (key: string): boolean => {
  return sensitivePrefixes.some((sensitivePrefix) => key.startsWith(sensitivePrefix));
};

const splitIntoChunks = (value: string, chunkSize: number): string[] => {
  if (!value.length) {
    return [''];
  }

  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += chunkSize) {
    chunks.push(value.slice(i, i + chunkSize));
  }
  return chunks;
};

const removeSecureValue = async (key: string): Promise<void> => {
  const metaRaw = await SecureStore.getItemAsync(secureMetaKey(key));
  await SecureStore.deleteItemAsync(secureSingleKey(key));

  if (!metaRaw) {
    return;
  }

  try {
    const meta = JSON.parse(metaRaw) as { chunks?: number };
    const chunkCount = meta.chunks ?? 0;

    for (let index = 0; index < chunkCount; index += 1) {
      await SecureStore.deleteItemAsync(secureChunkKey(key, index));
    }
  } catch {
    // Best-effort cleanup when metadata is malformed.
  }

  await SecureStore.deleteItemAsync(secureMetaKey(key));
};

const writeSecureValue = async (key: string, value: string): Promise<void> => {
  await removeSecureValue(key);

  const chunks = splitIntoChunks(value, secureChunkSize);

  if (chunks.length === 1) {
    await SecureStore.setItemAsync(secureSingleKey(key), chunks[0]);
    return;
  }

  await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(secureChunkKey(key, index), chunk)));
  await SecureStore.setItemAsync(secureMetaKey(key), JSON.stringify({ chunks: chunks.length }));
};

const readSecureValue = async (key: string): Promise<string | null> => {
  const singleValue = await SecureStore.getItemAsync(secureSingleKey(key));
  if (singleValue !== null) {
    return singleValue;
  }

  const metaRaw = await SecureStore.getItemAsync(secureMetaKey(key));
  if (!metaRaw) {
    return null;
  }

  try {
    const meta = JSON.parse(metaRaw) as { chunks?: number };
    const chunkCount = meta.chunks ?? 0;

    if (chunkCount <= 0) {
      return null;
    }

    const chunkValues = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) => SecureStore.getItemAsync(secureChunkKey(key, index))),
    );

    if (chunkValues.some((chunk) => chunk === null)) {
      return null;
    }

    return chunkValues.join('');
  } catch {
    return null;
  }
};

export const readCache = async <T>(key: string): Promise<T | null> => {
  const raw = await (async () => {
    if (!isSensitiveKey(key)) {
      return AsyncStorage.getItem(key);
    }

    const secureValue = await readSecureValue(key);
    if (secureValue !== null) {
      return secureValue;
    }

    // One-time migration path from legacy AsyncStorage cache to encrypted storage.
    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue === null) {
      return null;
    }

    try {
      await writeSecureValue(key, legacyValue);
      await AsyncStorage.removeItem(key);
    } catch {
      // If migration fails, continue returning legacy cache for this session.
    }

    return legacyValue;
  })();

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
  const serialized = JSON.stringify(value);

  if (!isSensitiveKey(key)) {
    await AsyncStorage.setItem(key, serialized);
    return;
  }

  try {
    await writeSecureValue(key, serialized);
    await AsyncStorage.removeItem(key);
  } catch {
    // Failing to cache should not break normal app flows.
  }
};
