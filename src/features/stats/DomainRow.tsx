import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Domain } from '@/data/schema';
import { levelToRadarValue } from '@/domain';
import { ProgressBar } from '@/ui/ProgressBar';
import { colors, domainColor } from '@/ui/theme';

export interface DomainRowProps {
  domain: Domain;
  onPress?: () => void;
}

export function DomainRow({ domain, onPress }: DomainRowProps) {
  const color = domainColor(domain.key);
  const radarValue = levelToRadarValue(domain.level);

  return (
    <Pressable
      onPress={onPress}
      testID={`domain-row-${domain.key}`}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${domain.name}, level ${domain.level}`}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.name}>{domain.name}</Text>
      <Text style={styles.level}>
        Lv {domain.level}
        {domain.title ? ` · ${domain.title}` : ''}
      </Text>
      <View style={styles.barWrap}>
        <ProgressBar testID={`domain-row-${domain.key}-bar`} value={radarValue} color={color} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
  },
  level: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  barWrap: {
    width: 56,
  },
});
