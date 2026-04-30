

import { render, userEvent, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthScreen } from '../../src/screens/AuthScreen';

describe('AuthScreen', () => {
    it('shows AutoTrack title and subtitle', () => {
        const {getByText} = render(
        <NavigationContainer>
            <AuthScreen />
        </NavigationContainer>
        );

        expect(getByText('AutoTrack')).toBeTruthy();
        expect(getByText('Track maintenance, fuel, and service history for every vehicle.')).toBeTruthy();
    })
    it('shows email and password input fields', () => {
        render(
        <NavigationContainer>
            <AuthScreen />
        </NavigationContainer>
        );
        
        const EmailInput = screen.getByPlaceholderText('you@domain.com');
        const PasswordInput = screen.getByPlaceholderText('••••••••');
        expect(EmailInput).toBeOnTheScreen();
        expect(PasswordInput).toBeOnTheScreen();
    })
});