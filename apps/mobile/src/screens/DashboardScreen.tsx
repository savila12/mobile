import { StyleSheet, Text, View } from 'react-native';

// Styling tier: stable. Prefer NativeWind utilities for fast iteration.
import { useAutoTrack } from '../hooks/useAutoTrack';
import { monthlyMiles, monthlySpend, rollingAverageMpg } from '../lib/calculations';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { StatCard } from '../components/StatCard';
import { useAppContext } from '../lib/AppContext';
import { useNavigation, type NavigationProp } from '@react-navigation/native';

type MainTabParamList = {
  Dashboard: undefined;
  Garage: undefined;
  Fuel: undefined;
  Maintenance: undefined;
  History: undefined;
  Settings: undefined;
};

export const DashboardScreen = () => {
  const { userId, activeVehicleId } = useAppContext();
  const { activeVehicle, fuelLogs, tasks } = useAutoTrack(userId, activeVehicleId);
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();

  const milesThisMonth = monthlyMiles(fuelLogs);
  const spendThisMonth = monthlySpend(fuelLogs);
  const avgMpg = rollingAverageMpg(fuelLogs);
  const nextTask = tasks.find((task) => task.status === 'upcoming') || null;

  return (
    <Screen>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        {activeVehicle
          ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`
          : 'Add a vehicle to start tracking'}
      </Text>

      <View style={styles.row}>
        <StatCard label="Miles This Month" value={`${milesThisMonth}`} />
        <StatCard label="Monthly Spend" value={`$${spendThisMonth.toFixed(2)}`} />
      </View>

      <View style={styles.rowSecondary}>
        <StatCard label="Fuel Efficiency" value={avgMpg ? `${avgMpg} MPG` : '--'} />
        <StatCard
          label="Next Service"
          value={nextTask ? nextTask.title : 'None'}
          hint={nextTask?.due_date ? new Date(nextTask.due_date).toLocaleDateString() : undefined}
        />
      </View>

      <View style={styles.quickAddCard}>
        <Text style={styles.quickAddTitle}>Quick Add</Text>
        <Text style={styles.quickAddBody}>
          Use the Fuel and Maintenance tabs for one-tap logging while offline or online.
        </Text>
        <View style={styles.quickAddAction}>
          <PrimaryButton label="Log Fuel Fill-up" onPress={() => navigation.navigate('Fuel')} />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: '#a1a1aa',
    fontSize: 15,
  },
  row: {
    marginTop: 16,
    flexDirection: 'row',
    columnGap: 12,
  },
  rowSecondary: {
    marginTop: 12,
    flexDirection: 'row',
    columnGap: 12,
  },
  quickAddCard: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 16,
  },
  quickAddTitle: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '600',
  },
  quickAddBody: {
    marginTop: 4,
    color: '#71717a',
    fontSize: 12,
    lineHeight: 18,
  },
  quickAddAction: {
    marginTop: 12,
  },
});
