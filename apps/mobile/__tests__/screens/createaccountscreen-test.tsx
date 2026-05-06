import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { CreateAccountScreen } from '../../src/screens/CreateAccountScreen';

const mockGoBack = jest.fn();
const mockSignUpWithPassword = jest.fn();

jest.mock('@react-navigation/native', () => {
    const actual = jest.requireActual('@react-navigation/native');
    return {
        ...actual,
        useNavigation: () => ({ goBack: mockGoBack }),
    };
});

jest.mock('../../src/lib/auth', () => ({
    signUpWithPassword: (...args: unknown[]) => mockSignUpWithPassword(...args),
}));

describe('CreateAccountScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSignUpWithPassword.mockResolvedValue(undefined);
    });

    it('renders the create account form', () => {
        render(<CreateAccountScreen />);

        expect(screen.getByRole('button', { name: 'Create Account' })).toBeOnTheScreen();
        expect(screen.getByText('Create your account, then verify your email before signing in.')).toBeOnTheScreen();
        expect(screen.getByPlaceholderText('First and last name')).toBeOnTheScreen();
        expect(screen.getByPlaceholderText('you@domain.com')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: '‹ Back' })).toBeOnTheScreen();
    });

    it('shows a validation error for an invalid email address', async () => {
        render(<CreateAccountScreen />);
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText('you@domain.com'), 'invalid-email');
        await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'password123');
        await user.type(screen.getAllByPlaceholderText('••••••••')[1], 'password123');
        await user.press(screen.getByRole('button', { name: 'Create Account' }));

        expect(screen.getByText('Enter a valid email address.')).toBeOnTheScreen();
        expect(mockSignUpWithPassword).not.toHaveBeenCalled();
    });

    it('submits the form with a trimmed email and shows the success message', async () => {
        render(<CreateAccountScreen />);
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText('you@domain.com'), '  user@test.com  ');
        await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'password123');
        await user.type(screen.getAllByPlaceholderText('••••••••')[1], 'password123');
        await user.press(screen.getByRole('button', { name: 'Create Account' }));

        await waitFor(() => {
            expect(mockSignUpWithPassword).toHaveBeenCalledWith('user@test.com', 'password123');
        });

        expect(screen.getByText('Account created. Check your inbox to verify your email, then return to sign in.')).toBeOnTheScreen();
    });

    it('shows fallback error message when signup rejection is not an Error object', async () => {
        render(<CreateAccountScreen />);
        const user = userEvent.setup();

        mockSignUpWithPassword.mockRejectedValueOnce({});

        await user.type(screen.getByPlaceholderText('you@domain.com'), 'user@test.com');
        await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'password123');
        await user.type(screen.getAllByPlaceholderText('••••••••')[1], 'password123');
        await user.press(screen.getByRole('button', { name: 'Create Account' }));

        expect(screen.getByText('Please try again.')).toBeOnTheScreen();
    });
});