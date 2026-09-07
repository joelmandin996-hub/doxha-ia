// Brand colors mirror apps/web/src/index.css (light theme). Neutrals follow
// Apple's iOS system palette (grouped backgrounds, label hierarchy,
// hairline separators) so the app reads as a native iOS 18-era screen.
export const colors = {
  // iOS neutrals
  groupedBackground: '#F2F2F7',
  card: '#FFFFFF',
  background: '#F2F2F7',
  separator: 'rgba(60,60,67,0.29)',
  opaqueSeparator: '#E3E3E8',

  label: '#1C1C1E',
  secondaryLabel: '#6C6C70',
  tertiaryLabel: '#AEAEB2',
  foreground: '#1C1C1E',
  mutedForeground: '#6C6C70',
  border: '#E3E3E8',

  fill: 'rgba(120,120,128,0.12)',
  secondaryFill: 'rgba(120,120,128,0.08)',
  muted: 'rgba(120,120,128,0.08)',

  // Brand
  primary: '#4046e7',
  primaryForeground: '#ffffff',
  secondary: '#8d50e2',

  accent: '#ecedfd',
  accentForeground: '#252be4',

  success: '#1fa365',
  warning: '#f79708',
  destructive: '#e82c51',

  teal: '#1fad9f',
  coral: '#ed5c45',
  amber: '#f89412',
  rose: '#e74078',
  sky: '#1997f0',
  emerald: '#21ab74',

  module: {
    members: '#1997f0',
    groups: '#8d50e2',
    events: '#21ab74',
    calendar: '#f89412',
    agenda: '#ed5c45',
    followups: '#4046e7',
    budget: '#1fad9f',
    donations: '#e74078',
    comm: '#c43cdd',
    inventory: '#4360ef',
  },

  revenue: '#1fa365',
  expense: '#e82c51',
  donation: '#e74078',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

// `borderCurve: 'continuous'` gives the Apple "squircle" corner on iOS and
// is silently ignored elsewhere, so it's safe to spread everywhere.
export const continuousCorner = { borderCurve: 'continuous' };

export const shadow = {
  card: {
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  raised: {
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
