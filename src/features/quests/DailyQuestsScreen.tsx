import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { NotificationClient } from '@/data/notificationClient';
import type { SqliteClient } from '@/data/sqliteClient';
import { FloatingBackButton } from '@/ui/FloatingBackButton';
import { colors, domainColor } from '@/ui/theme';

import type { GenerateDailyQuestsOptions } from './dailyQuestsService';
import { QuestCard } from './QuestCard';
import { useDailyQuests } from './useDailyQuests';

export interface DailyQuestsScreenProps {
  dbFactory?: () => Promise<SqliteClient>;
  date?: string;
  onBack?: () => void;
  /** Test-only override for quest-selection randomness — see useDailyQuests. */
  selectionOptions?: GenerateDailyQuestsOptions;
  /** Test-only override for the notification client — see useDailyQuests. */
  notificationClientFactory?: () => NotificationClient;
}

export function DailyQuestsScreen({
  dbFactory,
  date,
  onBack,
  selectionOptions,
  notificationClientFactory,
}: DailyQuestsScreenProps) {
  const { quests, loading, error, completeQuest } = useDailyQuests(
    dbFactory,
    date,
    selectionOptions,
    notificationClientFactory,
  );
  const completedCount = quests.filter((quest) => quest.completed).length;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>Five quests</Text>

        {loading ? (
          <ActivityIndicator testID="daily-quests-loading" color={colors.gold} />
        ) : error ? (
          <Text testID="daily-quests-error" style={styles.errorText}>
            Couldn&apos;t load today&apos;s quests.
          </Text>
        ) : (
          <>
            <Text testID="daily-quests-progress" style={styles.progress}>
              {completedCount} of {quests.length} complete
            </Text>
            <View style={styles.list}>
              {quests.map((quest) => (
                <QuestCard
                  key={quest.dailyQuestId}
                  quest={quest}
                  color={domainColor(quest.domainKey)}
                  onToggle={() => {
                    if (!quest.completed) {
                      void completeQuest(quest.dailyQuestId);
                    }
                  }}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <FloatingBackButton onPress={onBack} testID="daily-quests-back" />
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
    marginBottom: 8,
  },
  progress: {
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 12,
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
