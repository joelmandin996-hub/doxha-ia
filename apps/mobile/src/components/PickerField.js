import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme/colors';

export default function PickerField({ label, value, placeholder = 'Sélectionner...', onPress }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  value: {
    fontSize: 15,
    color: colors.foreground,
    flex: 1,
  },
  placeholder: {
    color: colors.mutedForeground,
  },
});
