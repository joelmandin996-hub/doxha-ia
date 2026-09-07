import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '../theme/colors';

export default function ChipSelect({ label, options, value, onChange, colorFor, labelFor }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {options.map((option) => {
            const selected = option === value;
            const color = colorFor?.(option) || colors.primary;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  { borderColor: selected ? color : colors.border },
                  selected && { backgroundColor: `${color}1a` },
                ]}
                onPress={() => onChange(option)}
              >
                <Text style={[styles.chipText, selected && { color, fontWeight: '700' }]}>
                  {labelFor?.(option) || option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
});
