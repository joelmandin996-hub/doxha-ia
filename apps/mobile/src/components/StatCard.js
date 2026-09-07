import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/colors';

export default function StatCard({ label, value, color = colors.primary, icon }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}1a` }]}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.foreground,
  },
  label: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
