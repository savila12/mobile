import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

// Styling tier: stable. NativeWind utilities are preferred for screen composition.
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { VehicleCard } from '../components/VehicleCard';
import { Screen } from '../components/Screen';
import { useAutoTrack } from '../hooks/useAutoTrack';
import { useAppContext } from '../lib/AppContext';
import { UnitSystem } from '../types/models';

export const GarageScreen = () => {
  const { userId, activeVehicleId, setActiveVehicleId } = useAppContext();
  const { vehicles, createVehicle, setActiveVehicle, deleteVehicle } = useAutoTrack(userId, activeVehicleId);

  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [odometer, setOdometer] = useState('');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loadingVehicleId, setLoadingVehicleId] = useState<string | null>(null);

  // useEffect(() => {
  //   if (vehicles.length === 0) {
  //     setShowAddForm(true);
  //   }
  // }, [vehicles.length]);

  const onEditVehicle = async (vehicleId: string) => {
    Alert.alert('Edit Vehicle', `Edit functionality for vehicle ID ${vehicleId} is not implemented yet.`);
  };

  const onDeleteVehicle = async (vehicleId: string) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoadingVehicleId(vehicleId);
            try {
              await deleteVehicle(vehicleId);
            } catch (error: unknown) {
              Alert.alert('Could not delete vehicle', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setLoadingVehicleId(null);
              setShowAddForm(true);
            }
          },
        },
      ],
    );
  };

  const onAddVehicle = async () => {
    if (!year || !make || !model) {
      Alert.alert('Missing details', 'Year, make, and model are required.');
      return;
    }

    try {
      setIsAddingVehicle(true);

      const created = await createVehicle({
        year: Number(year),
        make,
        model,
        trim,
        color,
        vin,
        unit_system: unitSystem,
        current_odometer: Number(odometer || 0),
      });

      if (!activeVehicleId) {
        await setActiveVehicle(created.id);
        setActiveVehicleId(created.id);
      }

      setYear('');
      setMake('');
      setModel('');
      setTrim('');
      setColor('');
      setVin('');
      setOdometer('');
      setShowAddForm(false);

      Alert.alert('Vehicle added', `${created.year} ${created.make} ${created.model} was added successfully.`);
    } catch (error: unknown) {
      Alert.alert('Could not add vehicle', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsAddingVehicle(false);
    }
  };

  const onSetPrimary = async (vehicleId: string) => {
    try {
      await setActiveVehicle(vehicleId);
      setActiveVehicleId(vehicleId);
    } catch (error: unknown) {
      Alert.alert('Could not set primary vehicle', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Garage</Text>
      <Text style={styles.subtitle}>Add and manage every vehicle in one place.</Text>

      {vehicles.length > 0 ? (
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Your Vehicles</Text>
          <View style={styles.listStack}>
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isActive={activeVehicleId === vehicle.id}
                onSetPrimary={onSetPrimary}
                onEdit={onEditVehicle}
                onDelete={onDeleteVehicle}
                isLoading={loadingVehicleId === vehicle.id}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.addHeader}>
        <Text style={styles.sectionTitle}>{vehicles.length > 0 ? 'Add Another Vehicle' : 'Add Vehicle'}</Text>
        <PrimaryButton
          label={showAddForm ? 'Hide Form' : 'Add Vehicle'}
          onPress={() => setShowAddForm((prev) => !prev)}
        />
      </View>

      {showAddForm ? (
        <View style={styles.formCard}>
          <InputField label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
          <InputField label="Make" value={make} onChangeText={setMake} />
          <InputField label="Model" value={model} onChangeText={setModel} />
          <InputField label="Trim" value={trim} onChangeText={setTrim} />
          <InputField label="Color" value={color} onChangeText={setColor} />
          <InputField label="VIN" value={vin} onChangeText={setVin} />
          <InputField label="Current Odometer" value={odometer} onChangeText={setOdometer} keyboardType="numeric" />

          <View style={styles.unitRow}>
          <Pressable
            onPress={() => setUnitSystem('imperial')}
            style={[styles.unitOption, unitSystem === 'imperial' ? styles.unitOptionActive : styles.unitOptionInactive]}
          >
            <Text style={styles.unitText}>Imperial</Text>
          </Pressable>
          <Pressable
            onPress={() => setUnitSystem('metric')}
            style={[styles.unitOption, unitSystem === 'metric' ? styles.unitOptionActive : styles.unitOptionInactive]}
          >
            <Text style={styles.unitText}>Metric</Text>
          </Pressable>
        </View>

        <PrimaryButton label={isAddingVehicle ? 'Adding Vehicle...' : 'Add Vehicle'} onPress={onAddVehicle} disabled={isAddingVehicle} />
      </View>
      ) : null}
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
  sectionTitle: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '700',
  },
  listSection: {
    marginTop: 16,
  },
  listStack: {
    marginTop: 10,
    rowGap: 12,
  },

  addHeader: {
    marginTop: 16,
    marginBottom: 10,
    rowGap: 8,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 16,
  },
  unitRow: {
    marginBottom: 12,
    flexDirection: 'row',
    columnGap: 8,
  },
  unitOption: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  unitOptionActive: {
    backgroundColor: '#0fb37f',
  },
  unitOptionInactive: {
    backgroundColor: '#27272a',
  },
  unitText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
