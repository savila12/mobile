import AsyncStorage from '@react-native-async-storage/async-storage';
import { keys, readCache, writeCache } from '../../src/lib/storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

describe('storage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('keys', () => {
        it('generates a vehicles key for a userId', () => {
            expect(keys.vehicles('user-1')).toBe('autotrack:vehicles:user-1');
        });

        it('generates a fuelLogs key for a vehicleId', () => {
            expect(keys.fuelLogs('v-1')).toBe('autotrack:fuelLogs:v-1');
        });

        it('generates a tasks key for a vehicleId', () => {
            expect(keys.tasks('v-1')).toBe('autotrack:tasks:v-1');
        });

        it('generates a serviceHistory key for a vehicleId', () => {
            expect(keys.serviceHistory('v-1')).toBe('autotrack:history:v-1');
        });

        it('has a static queue key', () => {
            expect(keys.queue).toBe('autotrack:offlineQueue');
        });
    });

    describe('readCache', () => {
        it('returns null when key does not exist', async () => {
            mockGetItem.mockResolvedValue(null);
            const result = await readCache('some-key');
            expect(result).toBeNull();
        });

        it('returns parsed value when key exists', async () => {
            mockGetItem.mockResolvedValue(JSON.stringify({ foo: 'bar' }));
            const result = await readCache<{ foo: string }>('some-key');
            expect(result).toEqual({ foo: 'bar' });
        });

        it('returns null when stored value is invalid JSON', async () => {
            mockGetItem.mockResolvedValue('not-valid-json{{');
            const result = await readCache('some-key');
            expect(result).toBeNull();
        });
    });

    describe('writeCache', () => {
        it('serializes value to AsyncStorage', async () => {
            mockSetItem.mockResolvedValue(undefined);
            await writeCache('some-key', { a: 1 });
            expect(mockSetItem).toHaveBeenCalledWith('some-key', JSON.stringify({ a: 1 }));
        });
    });
});
