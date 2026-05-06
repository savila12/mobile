/**
 * Tests for useAutoTrack hook - using mock data mode.
 */

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

jest.mock('../../src/lib/devConfig', () => ({
    USE_MOCK_DATA: true,
    MOCK_USER_ID: 'mock-user-1',
    APP_VERSION: '1.0.0',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

jest.mock('../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        rpc: jest.fn(),
        auth: {
            getSession: jest.fn(),
            onAuthStateChange: jest.fn(() => ({
                data: { subscription: { unsubscribe: jest.fn() } },
            })),
        },
    },
}));

jest.mock('../../src/lib/offlineQueue', () => ({
    enqueueOperation: jest.fn().mockResolvedValue(undefined),
}));

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useAutoTrack } from '../../src/hooks/useAutoTrack';

const USER_ID = 'mock-user-1';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
}

describe('useAutoTrack', () => {
    it('loads profile and vehicles for a user', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAutoTrack(USER_ID, null), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.profile).toBeDefined();
        expect(result.current.vehicles.length).toBeGreaterThan(0);
    });

    it('resolves active vehicle from vehicles list', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAutoTrack(USER_ID, null), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Should pick the primary vehicle
        expect(result.current.activeVehicle).not.toBeNull();
        expect(result.current.activeVehicle?.is_primary).toBe(true);
    });

    it('loads fuel logs for the active vehicle', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAutoTrack(USER_ID, null), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(Array.isArray(result.current.fuelLogs)).toBe(true);
    });

    it('loads maintenance tasks for the active vehicle', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAutoTrack(USER_ID, null), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(Array.isArray(result.current.tasks)).toBe(true);
    });

    it('loads service history for the active vehicle', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAutoTrack(USER_ID, null), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(Array.isArray(result.current.history)).toBe(true);
    });

    it('does not fetch data when userId is null', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAutoTrack(null, null), { wrapper });

        // Without userId, queries are disabled so isLoading should be false quickly
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.vehicles).toEqual([]);
        expect(result.current.activeVehicle).toBeNull();
    });

    it('exposes refresh, createVehicle, createFuelLog, createTask, completeTask, deleteVehicle, addServiceRecord', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAutoTrack(USER_ID, null), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(typeof result.current.refresh).toBe('function');
        expect(typeof result.current.createVehicle).toBe('function');
        expect(typeof result.current.createFuelLog).toBe('function');
        expect(typeof result.current.createTask).toBe('function');
        expect(typeof result.current.completeTask).toBe('function');
        expect(typeof result.current.deleteVehicle).toBe('function');
        expect(typeof result.current.addServiceRecord).toBe('function');
    });

    it('prefers the passed activeVehicleId if it exists in vehicles list', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAutoTrack(USER_ID, null), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const vehicles = result.current.vehicles;
        const nonPrimary = vehicles.find((v) => !v.is_primary);
        if (!nonPrimary) return; // Skip if no non-primary vehicle in seed data

        // Re-render with the non-primary vehicle ID
        const { result: result2 } = renderHook(() => useAutoTrack(USER_ID, nonPrimary.id), { wrapper });
        await waitFor(() => expect(result2.current.isLoading).toBe(false));
        expect(result2.current.activeVehicle?.id).toBe(nonPrimary.id);
    });
});
