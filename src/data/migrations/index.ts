import { migration001Init } from './001_init';
import { migration002HealthImports } from './002_health_imports';
import type { Migration } from './types';

export type { Migration };

export const migrations: Migration[] = [migration001Init, migration002HealthImports];
