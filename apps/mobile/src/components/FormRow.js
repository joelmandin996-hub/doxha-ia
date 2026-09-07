import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

// An editable iOS "Settings.app" style row. Single-line fields sit label-left,
// input-right; multiline fields (notes, descriptions) stack label above a
// full-width text area instead.
export default function FormRow({ label, value, onChangeText, multiline, ...rest }) {
  if (multiline) {
    return (
      <View style={styles.stacked}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.tertiaryLabel}
          multiline
          style={styles.multilineInput}
          {...rest}
        />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.tertiaryLabel}
        style={styles.input}
        textAlign="right"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    color: colors.label,
    minWidth: 108,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.label,
    paddingVertical: 0,
  },
  stacked: {
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  multilineInput: {
    fontSize: 16,
    color: colors.label,
    marginTop: 6,
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
