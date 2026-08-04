/** Palette lifted from design/chronicle-ui-style-guide.html — the fantasy/parchment reference. */
export const colors = {
  ink: '#2b1b12',
  inkSoft: '#5a4632',
  parchment: '#ddc48d',
  parchmentLight: '#ecdcac',
  parchmentDark: '#c6a96f',
  parchmentCrease: '#b9986088',
  leather: '#1b140f',
  leatherLight: '#2c2118',
  gold: '#a9782f',
  goldBright: '#dcb15a',
  seal: '#7a1f1f',
  sealBright: '#a13a2c',
} as const;

export const domainColors: Record<string, string> = {
  health: '#7a1f1f',
  career: '#2a3b54',
  relationships: '#6b2942',
  finance: '#2f5d55',
  growth: '#3f5230',
};

export function domainColor(key: string): string {
  return domainColors[key] ?? colors.gold;
}
