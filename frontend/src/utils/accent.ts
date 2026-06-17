export type AccentId = 'green' | 'indigo' | 'red';

const STORAGE_KEY = 'alias_accent';

const LEGACY_ACCENT_MAP: Record<string, AccentId> = {
  violet: 'green',
  cyan: 'green',
  amber: 'red',
  green: 'green',
  indigo: 'indigo',
  red: 'red',
};

export const ACCENT_PALETTE: Record<AccentId, { label: string; accent: string; hover: string }> = {
  green: { label: 'GREEN', accent: '#22c55e', hover: '#16a34a' },
  indigo: { label: 'INDIGO', accent: '#6366F1', hover: '#4F46E5' },
  red: { label: 'RED', accent: '#E11D48', hover: '#BE123C' },
};

export const DEFAULT_ACCENT: AccentId = 'green';

export const normalizeAccent = (value: string | null): AccentId => {
  if (!value) return DEFAULT_ACCENT;
  return LEGACY_ACCENT_MAP[value] ?? DEFAULT_ACCENT;
};

export const getStoredAccent = (): AccentId =>
  normalizeAccent(localStorage.getItem(STORAGE_KEY));

export const applyAccentTheme = (accent: AccentId) => {
  const palette = ACCENT_PALETTE[accent];
  const root = document.documentElement;
  root.style.setProperty('--accent', palette.accent);
  root.style.setProperty('--accent-hover', palette.hover);
};

export const saveAccentTheme = (accent: AccentId) => {
  localStorage.setItem(STORAGE_KEY, accent);
  applyAccentTheme(accent);
};

export const syncAccentTheme = (value: string | null | undefined): AccentId => {
  const accent = normalizeAccent(value ?? null);
  saveAccentTheme(accent);
  return accent;
};
