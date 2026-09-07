import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '../theme/colors';

// A single iOS "Settings.app" style row: optional leading icon badge,
// label, right-aligned value/accessory, optional chevron when tappable.
export default function Row({
  icon,
  iconColor = colors.primary,
  label,
  value,
  placeholder,
  onPress,
  chevron,
  danger,
  children,
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const showChevron = chevron ?? (!!onPress && !danger);
  const isStandaloneAction = danger && !icon && value === undefined && !children && !showChevron;
  const displayValue = value || placeholder;
  const handlePress = danger
    ? () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
      }
    : onPress;
  return (
    <Wrapper
      style={[styles.row, isStandaloneAction && styles.rowCentered]}
      onPress={handlePress}
      activeOpacity={0.6}
    >
      {icon ? (
        <View style={[styles.iconBadge, { backgroundColor: `${iconColor}1f` }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
      ) : null}
      <Text
        style={[styles.label, danger && styles.dangerLabel, isStandaloneAction && styles.labelCentered]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {children ? (
        <View style={styles.accessory}>{children}</View>
      ) : displayValue !== undefined ? (
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {displayValue}
        </Text>
      ) : null}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={colors.tertiaryLabel} style={styles.chevron} />
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 10,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCentered: {
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    color: colors.label,
    flexShrink: 0,
  },
  labelCentered: {
    flex: 1,
    textAlign: 'center',
  },
  dangerLabel: {
    color: colors.destructive,
  },
  accessory: {
    flex: 1,
    alignItems: 'flex-end',
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: colors.secondaryLabel,
    textAlign: 'right',
  },
  placeholder: {
    color: colors.tertiaryLabel,
  },
  chevron: {
    marginLeft: 2,
  },
});
