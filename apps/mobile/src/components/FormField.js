import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme/colors';

export default function FormField({ label, value, onChangeText, multiline, ...rest }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
        {...rest}
      />
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
