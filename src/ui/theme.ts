/**
 * Maps a domain key to its CSS custom property reference (defined in
 * `theme.css`), so dynamic/data-driven domain keys can still resolve to the
 * right accent color without duplicating the actual hex values here.
 */
const DOMAIN_COLOR_VARS: Record<string, string> = {
  health: 'var(--dom-health)',
  career: 'var(--dom-career)',
  relationships: 'var(--dom-relationships)',
  finance: 'var(--dom-finance)',
  growth: 'var(--dom-growth)',
};

export function domainColor(key: string): string {
  return DOMAIN_COLOR_VARS[key] ?? 'var(--gold)';
}
