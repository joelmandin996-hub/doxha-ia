import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, continuousCorner, radius } from '../theme/colors';

const COLUMN_WIDTH = 240;

// A drag-free Kanban: columns scroll horizontally, cards scroll vertically
// within their column, and moving a card between statuses is done via the
// per-card move buttons (renderCard controls that) rather than drag-and-drop
// — real dragging would need reanimated/gesture-handler's worklet runtime,
// which isn't worth the native-config risk for what's fundamentally the
// same "change the status" action already available elsewhere.
export default function KanbanBoard({ statuses, statusColors, items, getStatus, renderCard }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
      {statuses.map((status) => {
        const columnItems = items.filter((item) => getStatus(item) === status);
        return (
          <View key={status} style={styles.column}>
            <View style={styles.columnHeader}>
              <View style={[styles.dot, { backgroundColor: statusColors[status] || colors.primary }]} />
              <Text style={styles.columnTitle} numberOfLines={1}>
                {status}
              </Text>
              <Text style={styles.columnCount}>{columnItems.length}</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.columnContent}>
              {columnItems.length === 0 ? (
                <Text style={styles.emptyColumn}>Aucun suivi</Text>
              ) : (
                columnItems.map((item) => renderCard(item, status))
              )}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  board: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 12,
  },
  column: {
    width: COLUMN_WIDTH,
    backgroundColor: colors.fill,
    borderRadius: radius.lg,
    ...continuousCorner,
    marginHorizontal: 4,
    paddingVertical: 12,
    maxHeight: '100%',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  columnTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.label,
  },
  columnCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryLabel,
    backgroundColor: colors.card,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  columnContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  emptyColumn: {
    fontSize: 13,
    color: colors.tertiaryLabel,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
