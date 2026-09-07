import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius } from '../theme/colors';

export default function PrimaryButton({ label, onPress, loading, disabled, variant = 'solid' }) {
  const isGhost = variant === 'ghost';
  return (
    <TouchableOpacity
      style={[styles.button, isGhost && styles.ghost, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.primary : colors.primaryForeground} />
      ) : (
        <Text style={[styles.text, isGhost && styles.ghostText]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: 15,
  },
  ghostText: {
    color: colors.foreground,
  },
});
