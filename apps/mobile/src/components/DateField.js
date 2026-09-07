import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Row from './Row';
import { colors } from '../theme/colors';
import { formatDate } from '../lib/format';

// On iOS this renders the native "compact" picker — a small pill button
// that opens the system date/time popover in place (the same control iOS
// uses in Calendar/Reminders). Android has no compact variant, so it falls
// back to a Row that opens the standard modal picker on tap.
export default function DateField({ label, value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const dateValue = value ? new Date(value) : new Date();

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) onChange(selectedDate.toISOString());
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.iosRow}>
        <Text style={styles.iosLabel}>{label}</Text>
        <DateTimePicker
          value={dateValue}
          mode="datetime"
          display="compact"
          onChange={handleChange}
          accentColor={colors.primary}
        />
      </View>
    );
  }

  return (
    <>
      <Row label={label} value={formatDate(value, "d MMM yyyy 'à' HH:mm")} onPress={() => setShowPicker(true)} />
      {showPicker && <DateTimePicker value={dateValue} mode="datetime" display="default" onChange={handleChange} />}
    </>
  );
}

const styles = StyleSheet.create({
  iosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  iosLabel: {
    fontSize: 16,
    color: colors.label,
  },
});
