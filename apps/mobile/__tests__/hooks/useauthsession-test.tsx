/**
 * Tests for useAuthSession hook.
 */

// Test mock data path first
jest.mock('../../src/lib/devConfig', () => ({
    USE_MOCK_DATA: true,
    MOCK_USER_ID: 'mock-user-1',
    APP_VERSION: '1.0.0',
}));

jest.mock('../../src/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
            onAuthStateChange: jest.fn(() => ({
                data: { subscription: { unsubscribe: jest.fn() } },
            })),
        },
    },
}));

import { renderHook, waitFor } from '@testing-library/react-native';
import { useAuthSession } from '../../src/hooks/useAuthSession';

describe('useAuthSession (mock data mode)', () => {
    it('returns mock session immediately', async () => {
        const { result } = renderHook(() => useAuthSession());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.session).not.toBeNull();
        expect(result.current.session?.user.id).toBe('mock-user-1');
        expect(result.current.authError).toBeNull();
    });
});
