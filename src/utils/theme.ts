export type AppTheme = 'modern_dark' | 'clean_light' | 'emerald_growth' | 'royal_indigo';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  description: string;
  accentColor: string;
  previewBg: string;
  previewCard: string;
  previewBorder: string;
  previewAccent: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'modern_dark',
    name: 'Modern Dark',
    description: 'Deep Slate canvas with vibrant Indigo & Cyan accents',
    accentColor: '#6366f1',
    previewBg: '#0B0F19',
    previewCard: '#1E293B',
    previewBorder: '#334155',
    previewAccent: '#6366F1'
  },
  {
    id: 'clean_light',
    name: 'Clean Light',
    description: 'Minimal Crisp White with deep Navy & Blue accents',
    accentColor: '#2563eb',
    previewBg: '#F8FAFC',
    previewCard: '#FFFFFF',
    previewBorder: '#CBD5E1',
    previewAccent: '#2563EB'
  },
  {
    id: 'emerald_growth',
    name: 'Emerald Growth',
    description: 'Dark Charcoal canvas with refreshing Emerald & Teal accents',
    accentColor: '#10b981',
    previewBg: '#08120D',
    previewCard: '#0F231B',
    previewBorder: '#1A3F31',
    previewAccent: '#10B981'
  },
  {
    id: 'royal_indigo',
    name: 'Royal Indigo',
    description: 'Midnight Velvet Purple with glowing Royal Violet accents',
    accentColor: '#8b5cf6',
    previewBg: '#0D0B1A',
    previewCard: '#1A1433',
    previewBorder: '#2E2457',
    previewAccent: '#8B5CF6'
  }
];

const THEME_STORAGE_KEY = 'myfin_selected_theme';

export function getSavedTheme(): AppTheme {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme;
  if (saved && THEMES.some(t => t.id === saved)) {
    return saved;
  }
  return 'modern_dark';
}

export function saveTheme(theme: AppTheme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyThemeToDocument(theme);
}

export function applyThemeToDocument(theme: AppTheme): void {
  const root = document.documentElement;
  // Remove any previous theme class
  root.classList.remove('theme-modern-dark', 'theme-clean-light', 'theme-emerald-growth', 'theme-royal-indigo');
  root.classList.add(`theme-${theme.replace('_', '-')}`);
  
  if (theme === 'clean_light') {
    document.body.style.backgroundColor = '#F8FAFC';
    document.body.style.color = '#0F172A';
  } else if (theme === 'emerald_growth') {
    document.body.style.backgroundColor = '#08120D';
    document.body.style.color = '#F1F5F9';
  } else if (theme === 'royal_indigo') {
    document.body.style.backgroundColor = '#0D0B1A';
    document.body.style.color = '#F1F5F9';
  } else {
    document.body.style.backgroundColor = '#0B0F19';
    document.body.style.color = '#F8FAFC';
  }
}
