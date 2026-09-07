import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { initials } from '../lib/format';

export default function Avatar({ name, size = 44, color = colors.primary }) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}1a` },
      ]}
    >
      <Text style={[styles.text, { color, fontSize: size * 0.36 }]}>{initials(name) || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
});
