import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// A nav-bar bar-button-item: pass either `icon` (SF-Symbols-style glyph) or
// `label` (iOS text buttons like "Modifier" / "Annuler") — never both.
export default function HeaderButton({ icon, label, onPress, color = colors.primary, bold }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={styles.button}
    >
      {icon ? (
        <Ionicons name={icon} size={24} color={color} />
      ) : (
        <Text style={[styles.label, { color }, bold && styles.labelBold]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: Platform.OS === 'ios' ? 0 : 8,
  },
  label: {
    fontSize: 17,
  },
  labelBold: {
    fontWeight: '600',
  },
});
