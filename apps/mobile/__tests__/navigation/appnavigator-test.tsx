/**
 * Tests for AppNavigator.
 */

import { render } from '@testing-library/react-native';

const mockUseAuthSession = jest.fn();
const mockWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

jest.mock('../../src/lib/devConfig', () => ({
  USE_MOCK_DATA: false,
  MOCK_USER_ID: 'mock-user-1',
  APP_VERSION: '1.0.0',
}));

jest.mock('../../src/hooks/useAuthSession', () => ({
  useAuthSession: (...args: unknown[]) => mockUseAuthSession(...args),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../src/components/StartupSplash', () => ({
  StartupSplash: ({ subtitle }: { subtitle: string }) => subtitle,
}));

jest.mock('../../src/lib/AppContext', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => children,
  useAppContext: jest.fn(),
}));

jest.mock('../../src/screens/AuthScreen', () => ({
  AuthScreen: () => 'AuthScreen',
}));

jest.mock('../../src/screens/CreateAccountScreen', () => ({
  CreateAccountScreen: () => 'CreateAccountScreen',
}));

jest.mock('../../src/screens/DashboardScreen', () => ({
  DashboardScreen: () => 'DashboardScreen',
}));

jest.mock('../../src/screens/FuelScreen', () => ({
  FuelScreen: () => 'FuelScreen',
}));

jest.mock('../../src/screens/GarageScreen', () => ({
  GarageScreen: () => 'GarageScreen',
}));

jest.mock('../../src/screens/HistoryScreen', () => ({
  HistoryScreen: () => 'HistoryScreen',
}));

jest.mock('../../src/screens/MaintenanceScreen', () => ({
  MaintenanceScreen: () => 'MaintenanceScreen',
}));

jest.mock('../../src/screens/SettingsScreen', () => ({
  SettingsScreen: () => 'SettingsScreen',
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  DarkTheme: {},
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ component: Component, children }: { component?: () => any; children?: () => any }) => {
      if (typeof children === 'function') {
        return children();
      }
      if (Component) {
        return <Component />;
      }
      return null;
    },
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ component: Component }: { component: () => any }) => <Component />,
  }),
}));

import { AppNavigator } from '../../src/navigation/AppNavigator';

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockWarn.mockRestore();
  });

  it('renders startup splash while loading', () => {
    mockUseAuthSession.mockReturnValue({
      session: null,
      isLoading: true,
      authError: null,
    });

    const { toJSON } = render(<AppNavigator />);
    expect(JSON.stringify(toJSON())).toContain('Checking your session...');
  });

  it('renders auth screens when user is signed out', () => {
    mockUseAuthSession.mockReturnValue({
      session: null,
      isLoading: false,
      authError: null,
    });

    const { toJSON } = render(<AppNavigator />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('AuthScreen');
    expect(tree).toContain('CreateAccountScreen');
  });

  it('renders main tabs when user is signed in', () => {
    mockUseAuthSession.mockReturnValue({
      session: { user: { id: 'real-user-1' } },
      isLoading: false,
      authError: null,
    });

    const { toJSON } = render(<AppNavigator />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('DashboardScreen');
    expect(tree).toContain('FuelScreen');
    expect(tree).toContain('GarageScreen');
    expect(tree).toContain('HistoryScreen');
    expect(tree).toContain('MaintenanceScreen');
    expect(tree).toContain('SettingsScreen');
  });

  it('warns in dev when auth bootstrap fails', () => {
    mockUseAuthSession.mockReturnValue({
      session: null,
      isLoading: false,
      authError: new Error('Auth bootstrap failed'),
    });

    render(<AppNavigator />);

    expect(mockWarn).toHaveBeenCalledWith('Auth bootstrap error:', 'Auth bootstrap failed');
  });
});
