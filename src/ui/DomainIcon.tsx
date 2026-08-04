import type { ReactNode } from 'react';

export interface DomainIconProps {
  domainKey: string;
  className?: string;
}

const ICON_PATHS: Record<string, ReactNode> = {
  health: (
    <path d="M12 21s-7.5-4.6-9.6-9C.8 8.6 2 5 5.3 5c1.9 0 3.3 1 4.7 2.8C11.4 6 12.8 5 14.7 5 18 5 19.2 8.6 17.6 12 15.5 16.4 12 21 12 21z" />
  ),
  career: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </>
  ),
  relationships: (
    <>
      <circle cx="9" cy="10" r="4.2" />
      <circle cx="16" cy="11" r="3.4" />
    </>
  ),
  finance: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.3 9.6c0-1.1 1.1-2 2.7-2s2.7.9 2.7 1.9-1.2 1.5-2.7 1.9-2.7 1-2.7 2 1.2 1.9 2.7 1.9 2.7-.9 2.7-2" />
    </>
  ),
  growth: (
    <>
      <path d="M12 22V12" />
      <path d="M12 12C12 12 4 12 4 4C4 4 12 4 12 12Z" />
      <path d="M12 12C12 12 20 12 20 4C20 4 12 4 12 12Z" />
    </>
  ),
};

const FALLBACK_ICON = <circle cx="12" cy="12" r="8.5" />;

/** A small hand-drawn line icon per domain, matching the style guide. Falls back to a plain circle for an unrecognized key. */
export function DomainIcon({ domainKey, className }: DomainIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[domainKey] ?? FALLBACK_ICON}
    </svg>
  );
}
