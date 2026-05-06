import { NavigationContainer } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';

import { AuthScreen } from '../../../apps/mobile/src/screens/AuthScreen';

const renderAuthScreen = () =>
  render(
    <NavigationContainer>
      <AuthScreen />
    </NavigationContainer>
  );

describe('AuthScreen', () => {
  it('shows the core auth entry points', () => {
    renderAuthScreen();

    expect(screen.getByText('AutoTrack')).toBeTruthy();
    expect(screen.getByPlaceholderText('you@domain.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy();
  });
});