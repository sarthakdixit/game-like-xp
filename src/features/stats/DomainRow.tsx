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
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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
      <Text style={styles.chevron}>&rsaquo;</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.parchmentLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.parchmentDark,
  },
  cardPressed: {
    backgroundColor: colors.parchmentDark,
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
  chevron: {
    fontSize: 16,
    color: colors.inkSoft,
    marginLeft: 2,
  },
});
