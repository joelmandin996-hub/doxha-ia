import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function Badge({ label, color = colors.primary }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1a` }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
