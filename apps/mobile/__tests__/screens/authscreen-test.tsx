
import { Alert } from 'react-native';
import { userEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthScreen } from '../../src/screens/AuthScreen';
import * as auth from '../../src/lib/auth';

jest.mock('../../src/lib/auth', () => ({
    signInWithPassword: jest.fn(),
    signInWithGoogle: jest.fn(),
}));

const renderAuthScreen = () =>
    render(
        <NavigationContainer>
            <AuthScreen />
        </NavigationContainer>
    );

describe('AuthScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows AutoTrack title and subtitle', () => {
        renderAuthScreen();

        expect(screen.getByText('AutoTrack')).toBeTruthy();
        expect(screen.getByText('Track maintenance, fuel, and service history for every vehicle.')).toBeTruthy();
    });

    it('shows email and password input fields', () => {
        renderAuthScreen();

        expect(screen.getByPlaceholderText('you@domain.com')).toBeTruthy();
        expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
    });

    it('shows sign in, sign up, and google buttons', () => {
        renderAuthScreen();

        expect(screen.getByRole('button', { name: 'Sign In' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Create Account' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeOnTheScreen();
    });

    it('shows alert when sign in fails', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        (auth.signInWithPassword as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

        renderAuthScreen();
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText('you@domain.com'), 'invalid-email');
        await user.type(screen.getByPlaceholderText('••••••••'), 'short');
        await user.press(screen.getByRole('button', { name: 'Sign In' }));

        expect(alertSpy).toHaveBeenCalledWith('Sign in failed', 'Invalid credentials');
    });

    it('shows alert when Google sign in fails', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        (auth.signInWithGoogle as jest.Mock).mockRejectedValueOnce(new Error('Google auth cancelled'));

        renderAuthScreen();
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Continue with Google' }));

        expect(alertSpy).toHaveBeenCalledWith('Google sign in failed', 'Google auth cancelled');
    });

    it('shows fallback message when sign in error has no message', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        (auth.signInWithPassword as jest.Mock).mockRejectedValueOnce({});

        renderAuthScreen();
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Sign In' }));

        expect(alertSpy).toHaveBeenCalledWith('Sign in failed', 'Please try again.');
    });

    it('shows Loading... on all buttons while sign in is in progress', async () => {
        let resolveSignIn!: () => void;
        (auth.signInWithPassword as jest.Mock).mockReturnValueOnce(
            new Promise<void>((resolve) => { resolveSignIn = resolve; })
        );

        renderAuthScreen();
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText('you@domain.com'), 'user@test.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
        await user.press(screen.getByRole('button', { name: 'Sign In' }));

        expect(screen.getAllByRole('button', { name: 'Loading...' })).toHaveLength(3);

        resolveSignIn();
    });

    it('restores button labels after sign in resolves', async () => {
        (auth.signInWithPassword as jest.Mock).mockResolvedValueOnce(undefined);

        renderAuthScreen();
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Sign In' }));

        expect(screen.getByRole('button', { name: 'Sign In' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Create Account' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeOnTheScreen();
    });

    it('restores button labels after sign in fails', async () => {
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        (auth.signInWithPassword as jest.Mock).mockRejectedValueOnce(new Error('fail'));

        renderAuthScreen();
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Sign In' }));

        expect(screen.getByRole('button', { name: 'Sign In' })).toBeOnTheScreen();
    });

    it('toggles password visibility when the eye icon is pressed', async () => {
        renderAuthScreen();
        const user = userEvent.setup();

        const passwordInput = screen.getByPlaceholderText('••••••••');
        expect(passwordInput.props.secureTextEntry).toBe(true);

        await user.press(screen.getByRole('button', { name: 'Show password' }));
        expect(screen.getByPlaceholderText('••••••••').props.secureTextEntry).toBe(false);

        await user.press(screen.getByRole('button', { name: 'Hide password' }));
        expect(screen.getByPlaceholderText('••••••••').props.secureTextEntry).toBe(true);
    });

    it('calls signInWithPassword with trimmed email and raw password', async () => {
        (auth.signInWithPassword as jest.Mock).mockResolvedValueOnce(undefined);

        renderAuthScreen();
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText('you@domain.com'), '  user@test.com  ');
        await user.type(screen.getByPlaceholderText('••••••••'), 'mypassword');
        await user.press(screen.getByRole('button', { name: 'Sign In' }));

        expect(auth.signInWithPassword).toHaveBeenCalledWith('user@test.com', 'mypassword');
    });

    it('does not call signInWithPassword when Create Account is pressed', async () => {
        renderAuthScreen();
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Create Account' }));

        expect(auth.signInWithPassword).not.toHaveBeenCalled();
    });
});