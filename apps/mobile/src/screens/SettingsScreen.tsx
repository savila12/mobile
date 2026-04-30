import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAppContext } from '../lib/AppContext';
import { signOut } from '../lib/auth';
import { APP_VERSION, USE_MOCK_DATA } from '../lib/devConfig';
import { UnitSystem } from '../types/models';

const useMockData = USE_MOCK_DATA;

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowValue}>{children}</View>
  </View>
);

export const SettingsScreen = () => {
  const { unitSystem, saveProfile } = useAppContext();
  const [isSavingUnits, setIsSavingUnits] = useState(false);

  const onSelectUnits = async (value: UnitSystem) => {
    if (value === unitSystem) return;
    setIsSavingUnits(true);
    try {
      await saveProfile({ default_unit_system: value });
    } catch {
      Alert.alert('Error', 'Could not save unit preference. Please try again.');
    } finally {
      setIsSavingUnits(false);
    }
  };

  const onSignOut = async () => {
    try {
      await signOut();
    } catch (error: unknown) {
      Alert.alert('Sign out failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account and preferences.</Text>

        {/* ── Units ──────────────────────────────────────────────── */}
        <SectionHeader title="Units" />
        <View style={styles.card}>
          <Row label="Distance & Fuel">
            <View style={styles.segmentControl}>
              {(['imperial', 'metric'] as UnitSystem[]).map((option) => {
                const isActive = unitSystem === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => onSelectUnits(option)}
                    disabled={isSavingUnits}
                    style={[styles.segment, isActive && styles.segmentActive]}
                    accessibilityLabel={option === 'imperial' ? 'Miles / MPG' : 'Km / L per 100'}
                  >
                    <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
                      {option === 'imperial' ? 'mi / MPG' : 'km / L'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Row>
        </View>

        {/* ── App ────────────────────────────────────────────────── */}
        <SectionHeader title="App" />
        <View style={styles.card}>
          <Row label="Version">
            <Text style={styles.valueText}>{APP_VERSION}</Text>
          </Row>
          {useMockData && (
            <View style={styles.mockBadge}>
              <Ionicons name="flask-outline" size={13} color="#6ee7b7" />
              <Text style={styles.mockBadgeText}>Mock mode active — data is local</Text>
            </View>
          )}
        </View>

        {/* ── Account ────────────────────────────────────────────── */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <PrimaryButton
            label={useMockData ? 'Mock Mode — Sign Out Disabled' : 'Sign Out'}
            onPress={onSignOut}
            disabled={useMockData}
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: '#a1a1aa',
    fontSize: 15,
    marginBottom: 4,
  },
  sectionHeader: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  rowLabel: {
    color: '#d4d4d8',
    fontSize: 15,
    flex: 1,
  },
  rowValue: {
    flex: 1,
    alignItems: 'flex-end',
  },
  segmentControl: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: '#0fb37f22',
  },
  segmentLabel: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '500',
  },
  segmentLabelActive: {
    color: '#0fb37f',
  },
  valueText: {
    color: '#a1a1aa',
    fontSize: 15,
  },
  mockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  mockBadgeText: {
    color: '#6ee7b7',
    fontSize: 13,
  },
});

