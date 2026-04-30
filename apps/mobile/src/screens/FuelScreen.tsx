import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { LineChart } from 'react-native-gifted-charts';

import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAutoTrack } from '../hooks/useAutoTrack';
import { rollingAverageMpg } from '../lib/calculations';
import { useAppContext } from '../lib/AppContext';

export const FuelScreen = () => {
  const { userId, activeVehicleId } = useAppContext();
  const { activeVehicle, fuelLogs, createFuelLog } = useAutoTrack(userId, activeVehicleId);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [odometer, setOdometer] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const rollingMpg = rollingAverageMpg(fuelLogs);

  const chartData = useMemo(
    () =>
      [...fuelLogs]
        .reverse()
        .filter((entry) => entry.mpg)
        .map((entry) => ({
          value: Number(entry.mpg || 0),
          label: new Date(entry.date).getDate().toString(),
        })),
    [fuelLogs],
  );

  const onAddFuel = async () => {
    if (!activeVehicle) {
      Alert.alert('No active vehicle', 'Set a primary vehicle first.');
      return;
    }

    const odometerValue = Number(odometer);
    const quantityValue = Number(quantity);
    const priceValue = Number(pricePerUnit);

    if (!odometerValue || !quantityValue || !priceValue) {
      Alert.alert('Missing fields', 'Enter odometer, quantity, and price.');
      return;
    }

    const totalCost = Number((quantityValue * priceValue).toFixed(2));

    try {
      setIsSaving(true);

      await createFuelLog({
        date: new Date(date).toISOString(),
        odometer: odometerValue,
        quantity: quantityValue,
        price_per_unit: priceValue,
        total_cost: totalCost,
        unit_system: activeVehicle.unit_system,
      });

      setOdometer('');
      setQuantity('');
      setPricePerUnit('');
    } catch (error: unknown) {
      Alert.alert('Could not save fill-up', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Fuel &amp; Mileage</Text>
      <Text style={styles.subtitle}>Log fill-ups and track efficiency trends over time.</Text>

      <View style={styles.card}>
        <InputField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <InputField label="Odometer" value={odometer} onChangeText={setOdometer} keyboardType="numeric" />
        <InputField
          label={activeVehicle?.unit_system === 'metric' ? 'Liters' : 'Gallons'}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        <InputField
          label={activeVehicle?.unit_system === 'metric' ? 'Price per Liter' : 'Price per Gallon'}
          value={pricePerUnit}
          onChangeText={setPricePerUnit}
          keyboardType="numeric"
        />
        <PrimaryButton
          label={isSaving ? 'Saving Fill-up...' : 'Save Fill-up'}
          onPress={onAddFuel}
          disabled={isSaving}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.rollingAvg}>Rolling Average: {rollingMpg || '--'} MPG</Text>
        {chartData.length ? (
          <View style={styles.chartWrapper}>
            <LineChart
              data={chartData}
              areaChart
              color="#0fb37f"
              startFillColor="#0fb37f"
              endFillColor="#0fb37f"
              startOpacity={0.45}
              endOpacity={0.05}
              spacing={28}
              initialSpacing={12}
              hideDataPoints
              yAxisTextStyle={{ color: '#a1a1aa' }}
              xAxisLabelTextStyle={{ color: '#a1a1aa' }}
              noOfSections={5}
              height={220}
            />
          </View>
        ) : (
          <Text style={styles.chartEmpty}>Add at least two fill-ups to visualize MPG.</Text>
        )}
      </View>

      <View style={styles.logList}>
        {fuelLogs.map((log) => (
          <View key={log.id} style={styles.logCard}>
            <Text style={styles.logDate}>{new Date(log.date).toLocaleDateString()}</Text>
            <Text style={styles.logMeta}>
              Odometer: {log.odometer} | Cost: ${Number(log.total_cost).toFixed(2)}
            </Text>
            <Text style={styles.logMeta}>MPG: {log.mpg ?? '--'}</Text>
          </View>
        ))}
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
  card: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 16,
  },
  rollingAvg: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  chartWrapper: {
    marginTop: 12,
  },
  chartEmpty: {
    marginTop: 8,
    color: '#71717a',
    fontSize: 14,
  },
  logList: {
    marginTop: 16,
    rowGap: 12,
  },
  logCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 16,
  },
  logDate: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  logMeta: {
    marginTop: 4,
    color: '#a1a1aa',
    fontSize: 14,
  },
});
