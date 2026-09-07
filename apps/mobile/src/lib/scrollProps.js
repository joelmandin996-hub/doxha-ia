// Spread onto every ScrollView/FlatList that sits directly under a native
// header (see navigation/stackOptions.js) so iOS reserves the right amount
// of space for the collapsing large title instead of hiding content behind
// the transparent/blurred bar. No-op on Android.
export const autoInset = {
  contentInsetAdjustmentBehavior: 'automatic',
};
