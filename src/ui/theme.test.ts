import { describe, expect, it } from 'vitest';

import { domainColor } from './theme';

describe('domainColor', () => {
  it('maps every known domain key to its own CSS variable', () => {
    expect(domainColor('health')).toBe('var(--dom-health)');
    expect(domainColor('career')).toBe('var(--dom-career)');
    expect(domainColor('relationships')).toBe('var(--dom-relationships)');
    expect(domainColor('finance')).toBe('var(--dom-finance)');
    expect(domainColor('growth')).toBe('var(--dom-growth)');
  });

  it('falls back to gold for an unrecognized key', () => {
    expect(domainColor('unknown')).toBe('var(--gold)');
  });
});
