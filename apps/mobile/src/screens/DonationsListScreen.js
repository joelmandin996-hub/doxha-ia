import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { colors, radius } from '../theme/colors';
import { formatDate } from '../lib/format';
import { formatAmount } from '../lib/currency';
import { useCollection } from '../lib/useCollection';

const STATUS_LABELS = { completed: 'Complété', pending: 'En attente' };
const STATUS_COLORS = { completed: colors.success, pending: colors.warning };

export default function DonationsListScreen({ navigation }) {
  const { items, loading, refreshing, refresh, reload } = useCollection('donations', {
    sort: '-date_don',
    expand: 'membre_id',
  });

  useFocusEffect(
    React.useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Dons</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('DonationForm')}>
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total des dons affichés</Text>
        <Text style={styles.totalValue}>{formatAmount(total)}</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={!loading ? <EmptyState title="Aucun don enregistré" /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.expand?.membre_id?.name || item.donor_name || 'Anonyme'}
              </Text>
              <Text style={styles.cardAmount}>{formatAmount(item.amount)}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardMeta}>{formatDate(item.date_don)}</Text>
              {item.statut ? (
                <Badge label={STATUS_LABELS[item.statut] || item.statut} color={STATUS_COLORS[item.statut] || colors.primary} />
              ) : null}
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.foreground,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.module.donations,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.module.donations,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
});
