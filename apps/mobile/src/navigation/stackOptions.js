import { colors } from '../theme/colors';

// Native iOS large-title header (Android falls back to a normal compact
// header automatically — that's expected platform behaviour, not a bug).
export const stackScreenOptions = {
  headerLargeTitle: true,
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.card },
  headerLargeStyle: { backgroundColor: colors.groupedBackground },
  headerTitleStyle: { color: colors.label, fontWeight: '600' },
  headerLargeTitleStyle: { color: colors.label, fontWeight: '800' },
  headerTintColor: colors.primary,
  contentStyle: { backgroundColor: colors.groupedBackground },
};

// For pushed sub-screens (detail/picker) — a large title on every level of
// the stack reads as broken, not native; only the root list screen keeps it.
export const detailScreenOptions = {
  headerLargeTitle: false,
};

// Create/edit forms present as an iOS sheet (slide up, grabber, "Annuler" /
// "Enregistrer" bar buttons) instead of pushing — the standard native
// pattern for "New Member"-style screens.
export const modalFormOptions = {
  ...detailScreenOptions,
  presentation: 'modal',
};
