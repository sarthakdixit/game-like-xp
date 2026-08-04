import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SqliteClient } from '@/data/sqliteClient';
import { titleForLevel, xpForLevel, xpProgressToNextLevel } from '@/domain/leveling';
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
  const insets = useSafeAreaInsets();

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

      <Pressable
        onPress={onBack}
        testID="domain-detail-back"
        hitSlop={8}
        style={({ pressed }) => [
          styles.floatingBack,
          { top: insets.top + 12 },
          pressed && styles.floatingBackPressed,
        ]}
      >
        <Text style={styles.floatingBackIcon}>&larr;</Text>
      </Pressable>
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

const BACK_BUTTON_SIZE = 40;

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
  floatingBack: {
    position: 'absolute',
    left: 16,
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: BACK_BUTTON_SIZE / 2,
    backgroundColor: colors.leather,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingBackPressed: {
    opacity: 0.8,
  },
  floatingBackIcon: {
    fontSize: 18,
    color: colors.goldBright,
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
