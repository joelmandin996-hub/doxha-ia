import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AnimatedCounter from './AnimatedCounter';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';

export default function StatCard({ label, value, color = colors.primary, icon }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}1f` }]}>{icon}</View>
      {typeof value === 'number' ? (
        <AnimatedCounter value={value} style={styles.value} />
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...continuousCorner,
    padding: 16,
    ...shadow.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    ...continuousCorner,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.label,
  },
  label: {
    fontSize: 13,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
});
