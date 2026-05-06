import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppProvider, useAppContext } from '../../src/lib/AppContext';

const mockEnsureProfile = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('../../src/lib/api', () => ({
    ensureProfile: (...args: unknown[]) => mockEnsureProfile(...args),
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(AppProvider, { userId: 'user-1' }, children);

describe('AppContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockEnsureProfile.mockResolvedValue({
            active_vehicle_id: 'v-1',
            default_unit_system: 'metric',
        });
        mockUpdateProfile.mockResolvedValue({ default_unit_system: 'imperial' });
    });

    it('throws when useAppContext is used outside of AppProvider', () => {
        expect(() => {
            renderHook(() => useAppContext());
        }).toThrow('useAppContext must be used inside AppProvider');
    });

    it('initializes userId, activeVehicleId, and unitSystem from ensureProfile', async () => {
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.activeVehicleId).toBe('v-1');
        });

        expect(result.current.userId).toBe('user-1');
        expect(result.current.unitSystem).toBe('metric');
    });

    it('handles ensureProfile rejection gracefully', async () => {
        mockEnsureProfile.mockRejectedValue(new Error('network error'));
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.activeVehicleId).toBeNull();
        });
    });

    it('updates unitSystem when saveProfile is called', async () => {
        const { result } = renderHook(() => useAppContext(), { wrapper });
        await waitFor(() => expect(result.current.activeVehicleId).toBe('v-1'));

        await act(async () => {
            await result.current.saveProfile({ default_unit_system: 'imperial' });
        });

        expect(mockUpdateProfile).toHaveBeenCalledWith('user-1', { default_unit_system: 'imperial' });
        expect(result.current.unitSystem).toBe('imperial');
    });

    it('setActiveVehicleId updates the stored vehicleId', async () => {
        const { result } = renderHook(() => useAppContext(), { wrapper });
        await waitFor(() => expect(result.current.activeVehicleId).toBe('v-1'));

        act(() => {
            result.current.setActiveVehicleId('v-2');
        });

        expect(result.current.activeVehicleId).toBe('v-2');
    });
});
