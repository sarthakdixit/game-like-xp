export interface Migration {
  version: number;
  up: string;
  down: string;
}
