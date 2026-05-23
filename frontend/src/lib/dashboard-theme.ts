/** Shared dashboard appearance — Themesberg Neumorphism UI palette */

export type DashboardThemeId = 'light' | 'dark' | 'ocean' | 'lavender';

export const DASHBOARD_THEME_KEY = 'neurolxpDashboardTheme';

export const DASHBOARD_THEMES: {
  id: DashboardThemeId;
  label: string;
  description: string;
  preview: string;
}[] = [
  { id: 'light', label: 'Light', description: 'Classic neumorphic gray', preview: '#e6e7ee' },
  { id: 'dark', label: 'Dark', description: 'Dark neumorphic', preview: '#1a2029' },
  { id: 'ocean', label: 'Ocean', description: 'Cool blue surface', preview: '#d4e4f0' },
  { id: 'lavender', label: 'Lavender', description: 'Soft purple tint', preview: '#e8e4f2' },
];

export function getStoredDashboardTheme(): DashboardThemeId {
  if (typeof window === 'undefined') return 'light';
  const keys = [
    DASHBOARD_THEME_KEY,
    'saDashboardTheme',
    'paDashboardTheme',
    'iaDashboardTheme',
    'memberDashboardTheme',
  ];
  for (const key of keys) {
    const v = localStorage.getItem(key);
    if (v === 'dark' || v === 'ocean' || v === 'lavender' || v === 'light') return v;
  }
  return 'light';
}

export function applyDashboardTheme(theme: DashboardThemeId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-sa-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  localStorage.setItem(DASHBOARD_THEME_KEY, theme);
  localStorage.setItem('saDashboardTheme', theme);
  localStorage.setItem('paDashboardTheme', theme);
  localStorage.setItem('iaDashboardTheme', theme);
  localStorage.setItem('memberDashboardTheme', theme);
}
