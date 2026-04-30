import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuthSession } from '../hooks/useAuthSession';
import { AuthScreen } from '../screens/AuthScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FuelScreen } from '../screens/FuelScreen';
import { GarageScreen } from '../screens/GarageScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { MaintenanceScreen } from '../screens/MaintenanceScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StartupSplash } from '../components/StartupSplash';
import { AppProvider } from '../lib/AppContext';
import { CreateAccountScreen } from '../screens/CreateAccountScreen';
import { USE_MOCK_DATA, MOCK_USER_ID } from '../lib/devConfig';

const useMockData = USE_MOCK_DATA;
const mockUserId = MOCK_USER_ID;

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  CreateAccount: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111113',
          borderTopColor: '#27272a',
        },
        tabBarActiveTintColor: '#0fb37f',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarIcon: ({ color, size }) => {
          const iconName: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'speedometer-outline',
            Garage: 'car-sport-outline',
            Fuel: 'water-outline',
            Maintenance: 'construct-outline',
            History: 'time-outline',
            Settings: 'settings-outline',
          };

          return <Ionicons name={iconName[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Garage" component={GarageScreen} />
      <Tab.Screen name="Fuel" component={FuelScreen} />
      <Tab.Screen name="Maintenance" component={MaintenanceScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { session, isLoading, authError } = useAuthSession();
  const currentUserId = useMockData ? mockUserId : session?.user?.id;

  if (isLoading) {
    return <StartupSplash subtitle="Checking your session..." />;
  }

  if (!useMockData && authError) {
    if (__DEV__) {
      console.warn('Auth bootstrap error:', authError.message);
    }
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {currentUserId ? (
          <RootStack.Screen name="Main">
            {() => (
              <AppProvider userId={currentUserId}>
                <MainTabs />
              </AppProvider>
            )}
          </RootStack.Screen>
        ) : (
          <>
            <RootStack.Screen name="Auth" component={AuthScreen} />
            <RootStack.Screen name="CreateAccount" component={CreateAccountScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
