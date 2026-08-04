import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { SqliteClient } from '@/data/sqliteClient';
import { levelToRadarValue } from '@/domain';
import { RadarChart } from '@/ui/RadarChart';
import { colors } from '@/ui/theme';

import { DomainRow } from './DomainRow';
import { useDomains } from './useDomains';

export interface HomeScreenProps {
  dbFactory?: () => Promise<SqliteClient>;
}

export function HomeScreen({ dbFactory }: HomeScreenProps) {
  const { domains, loading, error } = useDomains(dbFactory);

  const axes = domains.map((domain) => ({
    key: domain.key,
    label: domain.name,
    value: levelToRadarValue(domain.level),
  }));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Chronicle</Text>
      <Text style={styles.subtitle}>Your standing</Text>

      {loading ? (
        <ActivityIndicator testID="home-screen-loading" color={colors.gold} />
      ) : error ? (
        <Text testID="home-screen-error" style={styles.errorText}>
          Couldn&apos;t load your character sheet.
        </Text>
      ) : (
        <>
          <View style={styles.chartWrap}>
            <RadarChart axes={axes} />
          </View>
          <View style={styles.list}>
            {domains.map((domain) => (
              <DomainRow key={domain.id} domain={domain} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    padding: 20,
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
    marginBottom: 12,
  },
  chartWrap: {
    marginVertical: 12,
  },
  list: {
    width: '100%',
    gap: 8,
  },
  errorText: {
    color: colors.seal,
    marginTop: 12,
  },
});
