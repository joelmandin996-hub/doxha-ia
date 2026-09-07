import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

// `edges` controls which sides get safe-area padding. Screens rendered
// under a native header (most of them, now that headers use
// headerLargeTitle) should exclude 'top' — the navigator already reserves
// that space — while header-less screens (Login, Dashboard) keep it.
export default function Screen({ children, style, edges = ['top', 'bottom', 'left', 'right'] }) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.groupedBackground,
  },
  container: {
    flex: 1,
  },
});
