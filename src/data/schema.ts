export interface Domain {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
  level: number;
  xp: number;
  title: string | null;
  createdAt: string;
}

export interface ChildStat {
  id: string;
  domainId: string;
  key: string;
  name: string;
  sortOrder: number;
  value: number;
  lastActiveAt: string;
  createdAt: string;
}

export interface Quest {
  id: string;
  domainId: string;
  text: string;
  xpReward: number;
  isBoss: boolean;
  createdAt: string;
}

export interface DailyQuest {
  id: string;
  questId: string;
  domainId: string;
  date: string;
  completedAt: string | null;
}

export interface XpEvent {
  id: string;
  domainId: string;
  amount: number;
  source: 'quest' | 'manual' | 'import';
  sourceId: string | null;
  createdAt: string;
  /** Tiebreak-safe ordering key — see `nextSequence()`. Not meant for display. */
  seq: number;
}

export interface ActivityEntry {
  /** = `date` — one entry per user per day, so resubmitting overwrites rather than duplicating. */
  id: string;
  date: string;
  steps: number;
  sleepHours: number;
  exerciseMinutes: number;
  /** The Fitness/Sleep child-stat deltas this entry mapped to, at the time it was last saved —
   * kept so a later resubmit for the same day can apply only the *change* in delta, not the
   * full new delta again. */
  fitnessDelta: number;
  sleepDelta: number;
  loggedAt: string;
}
