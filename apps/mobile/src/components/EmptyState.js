import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function EmptyState({ title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 6,
    textAlign: 'center',
  },
});
