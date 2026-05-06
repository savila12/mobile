/**
 * Tests for useSyncQueue hook.
 */

jest.mock('../../src/lib/offlineQueue', () => ({
    flushQueue: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-community/netinfo', () => ({
    addEventListener: jest.fn((callback) => {
        // Simulate immediate call with connected state
        callback({ isConnected: true });
        return () => {};
    }),
}));

jest.mock('../../src/lib/api', () => ({
    executeOfflineOperation: jest.fn().mockResolvedValue(undefined),
}));

import { renderHook } from '@testing-library/react-native';
import { useSyncQueue } from '../../src/hooks/useSyncQueue';
import { flushQueue } from '../../src/lib/offlineQueue';
import NetInfo from '@react-native-community/netinfo';

describe('useSyncQueue', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes and calls flushQueue on mount', () => {
        renderHook(() => useSyncQueue());
        expect(flushQueue).toHaveBeenCalled();
    });

    it('sets up NetInfo listener', () => {
        renderHook(() => useSyncQueue());
        expect(NetInfo.addEventListener).toHaveBeenCalled();
    });

    it('flushes queue when connection is restored', () => {
        const callback = jest.fn();
        (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => {
            callback.mockImplementation(cb);
            return () => {};
        });

        renderHook(() => useSyncQueue());

        // Trigger the callback with connected state
        callback({ isConnected: true });

        expect(flushQueue).toHaveBeenCalled();
    });

    it('does nothing when connection is lost', () => {
        const listeners: any[] = [];
        (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => {
            listeners.push(cb);
            return () => {};
        });

        renderHook(() => useSyncQueue());

        const initialCallCount = (flushQueue as jest.Mock).mock.calls.length;

        // Trigger the callback with disconnected state
        listeners.forEach((listener) => listener({ isConnected: false }));

        // flushQueue should not have been called again (only during initial mount)
        expect((flushQueue as jest.Mock).mock.calls.length).toBe(initialCallCount);
    });

    it('unsubscribes from NetInfo on unmount', () => {
        const unsubscribe = jest.fn();
        (NetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribe);

        const { unmount } = renderHook(() => useSyncQueue());

        unmount();

        expect(unsubscribe).toHaveBeenCalled();
    });
});
