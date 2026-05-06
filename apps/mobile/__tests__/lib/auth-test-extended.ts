/**
 * Tests for src/lib/auth.ts.
 */

const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignInWithOAuth = jest.fn();
const mockSetSession = jest.fn();
const mockSignOut = jest.fn();

jest.mock('../../src/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
            signUp: (...args: unknown[]) => mockSignUp(...args),
            signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
            setSession: (...args: unknown[]) => mockSetSession(...args),
            signOut: (...args: unknown[]) => mockSignOut(...args),
        },
    },
}));

jest.mock('../../src/lib/devConfig', () => ({
    USE_MOCK_DATA: false,
    MOCK_USER_ID: 'mock-user-1',
    APP_VERSION: '1.0.0',
}));

jest.mock('expo-linking', () => ({
    createURL: jest.fn((path: string) => `exp://auto-maker/${path}`),
    parse: jest.fn((url: string) => {
        const urlObj = new URL(url);
        return {
            queryParams: Object.fromEntries(urlObj.searchParams),
        };
    }),
}));

const mockOpenAuthSessionAsync = jest.fn();
jest.mock('expo-web-browser', () => ({
    maybeCompleteAuthSession: jest.fn(),
    openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSessionAsync(...args),
}));

import { signInWithPassword, signUpWithPassword, signOut, signInWithGoogle } from '../../src/lib/auth';

describe('auth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('signInWithPassword', () => {
        it('signs in with email and password', async () => {
            mockSignInWithPassword.mockResolvedValue({ data: null, error: null });
            await signInWithPassword('user@example.com', 'password123');
            expect(mockSignInWithPassword).toHaveBeenCalledWith({
                email: 'user@example.com',
                password: 'password123',
            });
        });

        it('throws when supabase returns an error', async () => {
            const error = new Error('Auth failed');
            mockSignInWithPassword.mockResolvedValue({ data: null, error });
            await expect(signInWithPassword('user@example.com', 'wrong')).rejects.toThrow('Auth failed');
        });
    });

    describe('signUpWithPassword', () => {
        it('signs up with email and password', async () => {
            mockSignUp.mockResolvedValue({ data: null, error: null });
            await signUpWithPassword('newuser@example.com', 'password123');
            expect(mockSignUp).toHaveBeenCalledWith({
                email: 'newuser@example.com',
                password: 'password123',
            });
        });

        it('throws when supabase returns an error', async () => {
            const error = new Error('Sign up failed');
            mockSignUp.mockResolvedValue({ data: null, error });
            await expect(signUpWithPassword('user@example.com', 'pass')).rejects.toThrow('Sign up failed');
        });
    });

    describe('signOut', () => {
        it('calls supabase sign out', async () => {
            mockSignOut.mockResolvedValue({ error: null });
            await signOut();
            expect(mockSignOut).toHaveBeenCalled();
        });

        it('throws when supabase returns an error', async () => {
            const error = new Error('Sign out failed');
            mockSignOut.mockResolvedValue({ error });
            await expect(signOut()).rejects.toThrow('Sign out failed');
        });
    });

    describe('signInWithGoogle', () => {
        it('throws when OAuth URL is not returned', async () => {
            mockSignInWithOAuth.mockResolvedValue({ data: null, error: null });
            await expect(signInWithGoogle()).rejects.toThrow('Google auth URL was not returned.');
        });

        it('throws when supabase returns an error', async () => {
            const error = new Error('OAuth failed');
            mockSignInWithOAuth.mockResolvedValue({ data: null, error });
            await expect(signInWithGoogle()).rejects.toThrow('OAuth failed');
        });

        it('handles successful OAuth login with tokens', async () => {
            mockSignInWithOAuth.mockResolvedValue({
                data: { url: 'https://example.com/auth' },
                error: null,
            });
            mockOpenAuthSessionAsync.mockResolvedValue({
                type: 'success',
                url: 'exp://auto-maker/auth/callback?access_token=token123&refresh_token=refresh123',
            });
            mockSetSession.mockResolvedValue({ error: null });

            await signInWithGoogle();

            expect(mockSetSession).toHaveBeenCalledWith({
                access_token: 'token123',
                refresh_token: 'refresh123',
            });
        });

        it('dismisses browser when user cancels', async () => {
            mockSignInWithOAuth.mockResolvedValue({
                data: { url: 'https://example.com/auth' },
                error: null,
            });
            mockOpenAuthSessionAsync.mockResolvedValue({ type: 'dismiss' });

            await signInWithGoogle();

            expect(mockSetSession).not.toHaveBeenCalled();
        });

        it('throws when setSession fails', async () => {
            mockSignInWithOAuth.mockResolvedValue({
                data: { url: 'https://example.com/auth' },
                error: null,
            });
            mockOpenAuthSessionAsync.mockResolvedValue({
                type: 'success',
                url: 'exp://auto-maker/auth/callback?access_token=token123&refresh_token=refresh123',
            });
            mockSetSession.mockResolvedValue({ error: new Error('Session failed') });

            await expect(signInWithGoogle()).rejects.toThrow('Session failed');
        });

        it('parses tokens from hash fragment callback URL', async () => {
            mockSignInWithOAuth.mockResolvedValue({
                data: { url: 'https://example.com/auth' },
                error: null,
            });
            mockOpenAuthSessionAsync.mockResolvedValue({
                type: 'success',
                url: 'exp://auto-maker/auth/callback#access_token=hash123&refresh_token=hash456',
            });
            mockSetSession.mockResolvedValue({ error: null });

            await signInWithGoogle();

            expect(mockSetSession).toHaveBeenCalledWith({
                access_token: 'hash123',
                refresh_token: 'hash456',
            });
        });

        it('does not set session when callback URL has missing tokens', async () => {
            mockSignInWithOAuth.mockResolvedValue({
                data: { url: 'https://example.com/auth' },
                error: null,
            });
            mockOpenAuthSessionAsync.mockResolvedValue({
                type: 'success',
                url: 'exp://auto-maker/auth/callback?access_token=onlyAccess',
            });

            await signInWithGoogle();

            expect(mockSetSession).not.toHaveBeenCalled();
        });
    });
});
