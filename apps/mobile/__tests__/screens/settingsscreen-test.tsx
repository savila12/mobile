import { Alert } from 'react-native';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { SettingsScreen } from '../../src/screens/SettingsScreen';

const mockUseAppContext = jest.fn();
const mockSaveProfile = jest.fn();
const mockSignOut = jest.fn();

jest.mock('../../src/lib/AppContext', () => ({
    useAppContext: () => mockUseAppContext(),
}));

jest.mock('../../src/lib/auth', () => ({
    signOut: () => mockSignOut(),
}));

jest.mock('../../src/lib/devConfig', () => ({
    APP_VERSION: '1.0.0',
    USE_MOCK_DATA: false,
}));

describe('SettingsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSaveProfile.mockResolvedValue(undefined);
        mockSignOut.mockResolvedValue(undefined);
        mockUseAppContext.mockReturnValue({
            unitSystem: 'imperial',
            saveProfile: mockSaveProfile,
        });
    });

    it('renders settings sections and app version', () => {
        render(<SettingsScreen />);

        expect(screen.getByText('Settings')).toBeOnTheScreen();
        expect(screen.getByText('Manage your account and preferences.')).toBeOnTheScreen();
        expect(screen.getByText('Units')).toBeOnTheScreen();
        expect(screen.getByText('App')).toBeOnTheScreen();
        expect(screen.getByText('Account')).toBeOnTheScreen();
        expect(screen.getByText('1.0.0')).toBeOnTheScreen();
    });

    it('saves the selected unit system', async () => {
        render(<SettingsScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByLabelText('Km / L per 100'));

        await waitFor(() => {
            expect(mockSaveProfile).toHaveBeenCalledWith({ default_unit_system: 'metric' });
        });
    });

    it('shows an alert when sign out fails', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockSignOut.mockRejectedValueOnce(new Error('Network issue'));

        render(<SettingsScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Sign Out' }));

        expect(alertSpy).toHaveBeenCalledWith('Sign out failed', 'Network issue');
    });

    it('shows an alert when saving unit preference fails', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockSaveProfile.mockRejectedValueOnce(new Error('Save failed'));

        render(<SettingsScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByLabelText('Km / L per 100'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Could not save unit preference. Please try again.');
    });
});