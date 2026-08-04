import type { Migration } from './types';

export const migration002HealthImports: Migration = {
  version: 2,
  up: `
    CREATE TABLE health_imports (
      id TEXT PRIMARY KEY NOT NULL,
      child_stat_id TEXT NOT NULL REFERENCES child_stats(id),
      date TEXT NOT NULL,
      applied_delta INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (child_stat_id, date)
    );
  `,
  down: `
    DROP TABLE IF EXISTS health_imports;
  `,
};
