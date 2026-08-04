import { migration001Init } from './001_init';
import type { Migration } from './types';

export type { Migration };

export const migrations: Migration[] = [migration001Init];
