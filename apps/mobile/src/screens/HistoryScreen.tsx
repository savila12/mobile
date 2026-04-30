import { useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/Screen';
import { useAutoTrack } from '../hooks/useAutoTrack';
import { useAppContext } from '../lib/AppContext';

const eventCardStyles: Record<string, { backgroundColor: string; borderColor: string }> = {
  fuel:        { backgroundColor: 'rgba(59,130,246,0.15)',  borderColor: 'rgba(59,130,246,0.3)' },
  maintenance: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
  repair:      { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
};

export const HistoryScreen = () => {
  const { userId, activeVehicleId } = useAppContext();
  const { history, refresh } = useAutoTrack(userId, activeVehicleId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0fb37f" />
      }
    >
      <Text style={styles.title}>Service History</Text>
      <Text style={styles.subtitle}>A merged timeline of maintenance, repairs, and fuel events.</Text>
      {isRefreshing ? (
        <View style={styles.refreshStatus}>
          <ActivityIndicator size="small" color="#0fb37f" />
          <Text style={styles.refreshStatusText}>Refreshing history...</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {!history.length && !isRefreshing ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No service history yet</Text>
            <Text style={styles.emptyText}>
              Add a fuel fill-up or complete a maintenance task to populate your timeline.
            </Text>
          </View>
        ) : null}

        {history.map((entry) => {
          const cardStyle = eventCardStyles[entry.event_type] ?? {
            backgroundColor: '#18181b',
            borderColor: '#27272a',
          };
          return (
            <View key={entry.id} style={[styles.card, cardStyle]}>
              <Text style={styles.eventType}>{entry.event_type}</Text>
              <Text style={styles.entryTitle}>{entry.title}</Text>
              <Text style={styles.meta}>{new Date(entry.date).toLocaleDateString()}</Text>
              <Text style={styles.meta}>Mileage: {entry.odometer}</Text>
              <Text style={styles.meta}>Cost: ${Number(entry.cost).toFixed(2)}</Text>
              {entry.notes ? <Text style={styles.notes}>{entry.notes}</Text> : null}
              {entry.photo_url ? <Text style={styles.attachment}>Attachment saved</Text> : null}
            </View>
          );
        })}
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
  list: {
    marginTop: 16,
    rowGap: 12,
  },
  refreshStatus: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  refreshStatusText: {
    color: '#a1a1aa',
    fontSize: 13,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 6,
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 20,
  },
  eventType: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  entryTitle: {
    marginTop: 4,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  meta: {
    marginTop: 2,
    color: '#d4d4d8',
    fontSize: 14,
  },
  notes: {
    marginTop: 6,
    color: '#a1a1aa',
    fontSize: 14,
  },
  attachment: {
    marginTop: 6,
    color: '#71717a',
    fontSize: 12,
  },
});
