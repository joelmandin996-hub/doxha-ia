import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import PressableScale from './PressableScale';
import { colors, continuousCorner, radius } from '../theme/colors';

// `inset` renders the row flush inside a GroupedSection card (no outer
// label/margin — the section's own title/footer take that role).
export default function ChipSelect({ label, options, value, onChange, colorFor, labelFor, inset }) {
  return (
    <View style={inset ? null : styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={inset ? styles.insetContent : styles.standaloneContent}
      >
        <View style={styles.row}>
          {options.map((option) => {
            const selected = option === value;
            const color = colorFor?.(option) || colors.primary;
            return (
              <PressableScale
                key={option}
                style={[styles.chip, selected ? { backgroundColor: color } : styles.chipIdle]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(option);
                }}
              >
                <Text style={[styles.chipText, selected ? styles.chipTextSelected : styles.chipTextIdle]}>
                  {labelFor?.(option) || option}
                </Text>
              </PressableScale>
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
    color: colors.label,
    marginBottom: 8,
    marginLeft: 16,
  },
  insetContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  standaloneContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderRadius: radius.pill,
    ...continuousCorner,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipIdle: {
    backgroundColor: colors.fill,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipTextIdle: {
    color: colors.secondaryLabel,
  },
});
