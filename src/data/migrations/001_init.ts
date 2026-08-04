import type { Migration } from './types';

export const migration001Init: Migration = {
  version: 1,
  up: `
    CREATE TABLE domains (
      id TEXT PRIMARY KEY NOT NULL,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      title TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE child_stats (
      id TEXT PRIMARY KEY NOT NULL,
      domain_id TEXT NOT NULL REFERENCES domains(id),
      key TEXT NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      last_active_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (domain_id, key)
    );

    CREATE TABLE quests (
      id TEXT PRIMARY KEY NOT NULL,
      domain_id TEXT NOT NULL REFERENCES domains(id),
      text TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      is_boss INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE daily_quests (
      id TEXT PRIMARY KEY NOT NULL,
      quest_id TEXT NOT NULL REFERENCES quests(id),
      domain_id TEXT NOT NULL REFERENCES domains(id),
      date TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE INDEX idx_daily_quests_date ON daily_quests(date);

    CREATE TABLE xp_events (
      id TEXT PRIMARY KEY NOT NULL,
      domain_id TEXT NOT NULL REFERENCES domains(id),
      amount INTEGER NOT NULL,
      source TEXT NOT NULL,
      source_id TEXT,
      created_at TEXT NOT NULL
    );
  `,
  down: `
    DROP TABLE IF EXISTS xp_events;
    DROP TABLE IF EXISTS daily_quests;
    DROP TABLE IF EXISTS quests;
    DROP TABLE IF EXISTS child_stats;
    DROP TABLE IF EXISTS domains;
  `,
};
