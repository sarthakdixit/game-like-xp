import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme';

import type { DisplayChildStat } from './useDomainDetail';

export interface ChildStatRowProps {
  stat: DisplayChildStat;
}

export function ChildStatRow({ stat }: ChildStatRowProps) {
  return (
    <View style={styles.row} testID={`child-stat-row-${stat.key}`}>
      <Text style={styles.name}>{stat.name}</Text>
      <Text style={[styles.value, stat.isDecaying && styles.decayingValue]}>
        {Math.round(stat.displayValue)}
        {stat.isDecaying ? (
          <Text testID={`child-stat-row-${stat.key}-decaying`} style={styles.decayingNote}>
            {' '}
            decaying
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 4,
  },
  name: {
    fontSize: 12.5,
    color: colors.ink,
  },
  value: {
    fontSize: 12.5,
    color: colors.inkSoft,
    fontVariant: ['tabular-nums'],
  },
  decayingValue: {
    color: colors.seal,
  },
  decayingNote: {
    fontSize: 10.5,
    color: colors.seal,
  },
});
