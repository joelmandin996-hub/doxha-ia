import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme/colors';

export default function SearchInput({ value, onChangeText, placeholder = 'Rechercher' }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={17} color={colors.secondaryLabel} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryLabel}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.fill,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 16,
    color: colors.label,
  },
});
