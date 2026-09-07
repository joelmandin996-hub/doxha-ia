import React, { Children } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';

// Renders children as an iOS "grouped table" card: rounded white card,
// hairline separators between rows, optional caption above/below.
export default function GroupedSection({ title, footer, children }) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.card}>
        {rows.map((child, index) => (
          <View key={index} style={index < rows.length - 1 ? styles.rowBorder : null}>
            {child}
          </View>
        ))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginBottom: 8,
    marginLeft: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...continuousCorner,
    overflow: 'hidden',
    ...shadow.card,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator,
  },
  footer: {
    fontSize: 13,
    color: colors.secondaryLabel,
    marginTop: 8,
    marginHorizontal: 16,
    lineHeight: 18,
  },
});
