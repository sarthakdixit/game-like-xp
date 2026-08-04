export interface DomainRow {
  id: string;
  key: string;
  name: string;
  sort_order: number;
  level: number;
  xp: number;
  title: string | null;
  created_at: string;
}

export interface ChildStatRow {
  id: string;
  domain_id: string;
  key: string;
  name: string;
  sort_order: number;
  value: number;
  last_active_at: string;
  created_at: string;
}

export interface QuestRow {
  id: string;
  domain_id: string;
  text: string;
  xp_reward: number;
  is_boss: 0 | 1;
  created_at: string;
}

export interface DailyQuestRow {
  id: string;
  quest_id: string;
  domain_id: string;
  date: string;
  completed_at: string | null;
}

export interface XpEventRow {
  id: string;
  domain_id: string;
  amount: number;
  source: 'quest' | 'manual' | 'import';
  source_id: string | null;
  created_at: string;
}

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
}

export interface HealthImportRow {
  id: string;
  child_stat_id: string;
  date: string;
  applied_delta: number;
  created_at: string;
}

export interface HealthImport {
  id: string;
  childStatId: string;
  date: string;
  appliedDelta: number;
  createdAt: string;
}

export function domainFromRow(row: DomainRow): Domain {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    sortOrder: row.sort_order,
    level: row.level,
    xp: row.xp,
    title: row.title,
    createdAt: row.created_at,
  };
}

export function childStatFromRow(row: ChildStatRow): ChildStat {
  return {
    id: row.id,
    domainId: row.domain_id,
    key: row.key,
    name: row.name,
    sortOrder: row.sort_order,
    value: row.value,
    lastActiveAt: row.last_active_at,
    createdAt: row.created_at,
  };
}

export function questFromRow(row: QuestRow): Quest {
  return {
    id: row.id,
    domainId: row.domain_id,
    text: row.text,
    xpReward: row.xp_reward,
    isBoss: row.is_boss === 1,
    createdAt: row.created_at,
  };
}

export function dailyQuestFromRow(row: DailyQuestRow): DailyQuest {
  return {
    id: row.id,
    questId: row.quest_id,
    domainId: row.domain_id,
    date: row.date,
    completedAt: row.completed_at,
  };
}

export function xpEventFromRow(row: XpEventRow): XpEvent {
  return {
    id: row.id,
    domainId: row.domain_id,
    amount: row.amount,
    source: row.source,
    sourceId: row.source_id,
    createdAt: row.created_at,
  };
}

export function healthImportFromRow(row: HealthImportRow): HealthImport {
  return {
    id: row.id,
    childStatId: row.child_stat_id,
    date: row.date,
    appliedDelta: row.applied_delta,
    createdAt: row.created_at,
  };
}
