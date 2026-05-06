/**
 * Real-mode tests for useAuthSession (USE_MOCK_DATA=false).
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockUnsubscribe = jest.fn();
const authCallbackState: { callback: null | ((event: string, session: unknown | null) => void) } = {
  callback: null,
};

jest.mock('../../src/lib/devConfig', () => ({
  USE_MOCK_DATA: false,
  MOCK_USER_ID: 'mock-user-1',
  APP_VERSION: '1.0.0',
}));

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

import { useAuthSession } from '../../src/hooks/useAuthSession';

describe('useAuthSession (real mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authCallbackState.callback = null;

    mockOnAuthStateChange.mockImplementation((callback: (event: string, session: unknown | null) => void) => {
      authCallbackState.callback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });
  });

  it('loads initial session from supabase', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockOnAuthStateChange).toHaveBeenCalled();
    expect(result.current.session).toEqual({ user: { id: 'user-1' } });
    expect(result.current.authError).toBeNull();
  });

  it('sets authError when getSession fails', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Session load failed'),
    });

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.authError?.message).toBe('Session load failed');
  });

  it('updates session via auth change callback and unsubscribes on unmount', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const { result, unmount } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      authCallbackState.callback?.('SIGNED_IN', { user: { id: 'user-2' } });
    });

    expect(result.current.session).toEqual({ user: { id: 'user-2' } });

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
