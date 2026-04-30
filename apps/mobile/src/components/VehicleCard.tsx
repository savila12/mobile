import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from './PrimaryButton';
import { Vehicle } from '../types/models';

type Props = {
  vehicle: Vehicle;
  isActive: boolean;
  onSetPrimary: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
};

export const VehicleCard = ({ vehicle, isActive, onSetPrimary, onEdit, onDelete, isLoading }: Props) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.title}>
        {vehicle.year} {vehicle.make} {vehicle.model}
      </Text>
      <View style={styles.actions}>
        <Pressable
          disabled={isLoading}
          onPress={() => onEdit(vehicle.id)}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          hitSlop={8}
          accessibilityLabel="Edit vehicle"
        >
          <Feather name="edit-2" size={16} color="#ffffff" />
        </Pressable>
        <Pressable
          disabled={isLoading}
          onPress={() => onDelete(vehicle.id)}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          hitSlop={8}
          accessibilityLabel="Delete vehicle"
        >
          <Feather name="trash-2" size={16} color="#ffffff" />
        </Pressable>
      </View>
    </View>

    <Text style={styles.meta}>VIN: {vehicle.vin || 'N/A'}</Text>
    <Text style={styles.meta}>Mileage: {vehicle.current_odometer}</Text>
    <Text style={styles.meta}>Unit: {vehicle.unit_system}</Text>

    <View style={styles.primaryAction}>
      <PrimaryButton
        label={isActive ? 'Primary Vehicle' : 'Set as Primary'}
        onPress={() => onSetPrimary(vehicle.id)}
        disabled={isActive || isLoading}
      />
    </View>

    {isLoading ? (
      <View style={styles.loadingOverlay} pointerEvents="auto">
        <ActivityIndicator size="small" color="#ffffff" />
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    columnGap: 4,
  },
  iconButton: {
    borderRadius: 8,
    padding: 4,
  },
  iconButtonPressed: {
    backgroundColor: '#27272a',
  },

  meta: {
    marginTop: 4,
    color: '#a1a1aa',
    fontSize: 13,
  },
  primaryAction: {
    marginTop: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
});
