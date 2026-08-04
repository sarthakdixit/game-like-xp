import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { HealthClient } from '@/data/healthClient';
import type { SqliteClient } from '@/data/sqliteClient';
import { colors, domainColor } from '@/ui/theme';

import { type UseHealthStatusResult, useHealthStatus } from './useHealthStatus';

export interface HealthScreenProps {
  dbFactory?: () => Promise<SqliteClient>;
  healthClientFactory?: () => HealthClient;
}

function formatLastSynced(iso: string | null): string {
  if (!iso) {
    return 'Never synced';
  }
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return date.toDateString() === now.toDateString()
    ? `Today, ${time}`
    : `${date.toLocaleDateString()}, ${time}`;
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export function HealthScreen({ dbFactory, healthClientFactory }: HealthScreenProps) {
  const { status, loading, error, syncing, syncNow } = useHealthStatus(
    dbFactory,
    healthClientFactory,
  );
  const color = domainColor('health');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Health sync</Text>
        <Text style={styles.subtitle}>
          Steps, sleep, and workouts feed your Fitness and Sleep stats.
        </Text>

        {loading ? (
          <ActivityIndicator testID="health-screen-loading" color={colors.gold} />
        ) : error || !status ? (
          <Text testID="health-screen-error" style={styles.errorText}>
            Couldn&apos;t load health sync status.
          </Text>
        ) : (
          <HealthStatusCard status={status} color={color} syncing={syncing} onSyncNow={syncNow} />
        )}
      </ScrollView>
    </View>
  );
}

interface HealthStatusCardProps {
  status: NonNullable<UseHealthStatusResult['status']>;
  color: string;
  syncing: boolean;
  onSyncNow: () => Promise<void>;
}

function HealthStatusCard({ status, color, syncing, onSyncNow }: HealthStatusCardProps) {
  const connected = status.permissionStatus === 'granted';
  const disabled = syncing || !status.isAvailable;
  const buttonLabel = syncing ? 'Syncing…' : connected ? 'Sync now' : 'Connect';
  const statusLabel = !status.isAvailable
    ? 'Health Connect not available'
    : connected
      ? 'Connected'
      : 'Not connected';

  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: connected ? color : colors.inkSoft }]} />
        <Text testID="health-screen-status" style={styles.statusText}>
          {statusLabel}
        </Text>
      </View>

      <Text testID="health-screen-last-synced" style={styles.lastSynced}>
        {formatLastSynced(status.lastSyncedAt)}
      </Text>

      {status.lastSyncedAt ? (
        <Text testID="health-screen-deltas" style={styles.deltas}>
          {formatDelta(status.lastSyncFitnessDelta)} Fitness ·{' '}
          {formatDelta(status.lastSyncSleepDelta)} Sleep
        </Text>
      ) : null}

      <Pressable
        testID="health-screen-sync-button"
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        onPress={() => void onSyncNow()}
        disabled={disabled}
        style={[styles.button, { backgroundColor: color, opacity: disabled ? 0.6 : 1 }]}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    padding: 20,
    paddingTop: 64,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.parchmentLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.parchmentCrease,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  lastSynced: {
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  deltas: {
    fontSize: 13,
    color: colors.ink,
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f2ddd2',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: colors.seal,
    marginTop: 12,
  },
});
