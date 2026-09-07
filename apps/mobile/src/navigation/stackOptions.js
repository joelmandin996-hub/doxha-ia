import { Platform } from 'react-native';
import { colors } from '../theme/colors';

// Native iOS large-title header (Android falls back to a normal compact
// header automatically — that's expected platform behaviour, not a bug).
//
// On iOS the bar is transparent with a real system blur behind it (the
// same look as Messages/Settings/Music), so scrolled content shows
// through. That relies on the scroll view underneath opting in via
// `contentInsetAdjustmentBehavior="automatic"` (see lib/screenProps.js) —
// UIKit then reserves exactly the right space for the collapsing large
// title, which a fixed padding value couldn't do. Android keeps a plain
// opaque header since it has no equivalent system material.
export const stackScreenOptions = {
  headerLargeTitle: true,
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
  headerTransparent: Platform.OS === 'ios',
  headerBlurEffect: Platform.OS === 'ios' ? 'systemChromeMaterial' : undefined,
  headerStyle: Platform.OS === 'ios' ? undefined : { backgroundColor: colors.card },
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
