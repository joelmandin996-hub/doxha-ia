import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme/colors';
import { formatDate } from '../lib/format';

export default function DateField({ label, value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const dateValue = value ? new Date(value) : new Date();

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) onChange(selectedDate.toISOString());
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.button} onPress={() => setShowPicker(true)}>
        <Text style={styles.value}>{value ? formatDate(value, "d MMM yyyy 'à' HH:mm") : 'Choisir une date'}</Text>
        <Ionicons name="calendar-outline" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
        />
      )}
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
  },
});
