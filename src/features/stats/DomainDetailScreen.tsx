import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { SqliteClient } from '@/data/sqliteClient';
import { titleForLevel, xpForLevel, xpProgressToNextLevel } from '@/domain/leveling';
import { FloatingBackButton } from '@/ui/FloatingBackButton';
import { ProgressBar } from '@/ui/ProgressBar';
import { RadarChart } from '@/ui/RadarChart';
import { colors, domainColor } from '@/ui/theme';

import { ChildStatRow } from './ChildStatRow';
import { useDomainDetail } from './useDomainDetail';

export interface DomainDetailScreenProps {
  domainId: string;
  dbFactory?: () => Promise<SqliteClient>;
  onBack?: () => void;
}

export function DomainDetailScreen({ domainId, dbFactory, onBack }: DomainDetailScreenProps) {
  const { domain, childStats, loading, error } = useDomainDetail(domainId, dbFactory);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator testID="domain-detail-loading" color={colors.gold} />
        ) : error || !domain ? (
          <Text testID="domain-detail-error" style={styles.errorText}>
            Couldn&apos;t load this domain.
          </Text>
        ) : (
          <DomainDetailContent domain={domain} childStats={childStats} />
        )}
      </ScrollView>

      <FloatingBackButton onPress={onBack} testID="domain-detail-back" />
    </View>
  );
}

interface DomainDetailContentProps {
  domain: NonNullable<ReturnType<typeof useDomainDetail>['domain']>;
  childStats: ReturnType<typeof useDomainDetail>['childStats'];
}

function DomainDetailContent({ domain, childStats }: DomainDetailContentProps) {
  const color = domainColor(domain.key);
  const title = domain.title ?? titleForLevel(domain.level);
  const progress = xpProgressToNextLevel(domain.level, domain.xp);

  const axes = childStats.map((stat) => ({
    key: stat.key,
    label: stat.name,
    value: stat.displayValue,
  }));

  return (
    <>
      <Text style={[styles.domainLabel, { color }]}>
        {domain.name} · level {domain.level}
      </Text>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.xpRow}>
        <Text style={styles.xpLabel}>{domain.xp}xp</Text>
        <Text style={styles.xpLabel}>next: {xpForLevel(domain.level + 1)}xp</Text>
      </View>
      <View style={styles.xpBarWrap}>
        <ProgressBar
          testID="domain-detail-xp-bar"
          value={progress.ratio * 100}
          color={colors.gold}
        />
      </View>

      <View style={styles.chartWrap}>
        <RadarChart axes={axes} color={color} />
      </View>

      <View style={styles.statList}>
        {childStats.map((stat) => (
          <ChildStatRow key={stat.id} stat={stat} />
        ))}
      </View>
    </>
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
  domainLabel: {
    fontSize: 13,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 8,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  xpLabel: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  xpBarWrap: {
    width: '100%',
    marginTop: 4,
    marginBottom: 12,
  },
  chartWrap: {
    marginVertical: 12,
  },
  statList: {
    width: '100%',
    gap: 4,
  },
  errorText: {
    color: colors.seal,
    marginTop: 12,
  },
});
