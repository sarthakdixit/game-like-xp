import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/ui/theme';

import type { DailyQuestView } from './useDailyQuests';

export interface QuestCardProps {
  quest: DailyQuestView;
  color: string;
  onToggle: () => void;
}

export function QuestCard({ quest, color, onToggle }: QuestCardProps) {
  return (
    <Pressable
      onPress={onToggle}
      testID={`quest-card-${quest.domainKey}`}
      style={[styles.card, { borderLeftColor: color }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: quest.completed }}
      accessibilityLabel={`${quest.text}, ${quest.domainName}, ${quest.xpReward} xp${quest.isBoss ? ', boss quest' : ''}`}
    >
      {quest.isBoss ? (
        <View style={styles.bossBadge} testID={`quest-card-${quest.domainKey}-boss`}>
          <Text style={styles.bossBadgeText}>Boss</Text>
        </View>
      ) : null}

      <View
        style={[styles.checkbox, quest.completed && { backgroundColor: color, borderColor: color }]}
        testID={`quest-card-${quest.domainKey}-checkbox`}
      >
        {quest.completed ? (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              d="M5 13l4 4L19 7"
              fill="none"
              stroke="#fff5e6"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
      </View>

      <Text style={[styles.text, quest.completed && styles.textDone]} numberOfLines={2}>
        {quest.text}
      </Text>

      <Text style={styles.xp}>+{quest.xpReward}xp</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.parchmentLight,
    borderRadius: 8,
    borderLeftWidth: 4,
    position: 'relative',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: 13.5,
    color: colors.ink,
  },
  textDone: {
    color: colors.inkSoft,
    textDecorationLine: 'line-through',
  },
  xp: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  bossBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  bossBadgeText: {
    fontSize: 9,
    color: colors.leather,
  },
});
