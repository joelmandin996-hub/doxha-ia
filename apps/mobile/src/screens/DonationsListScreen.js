import React, { useLayoutEffect } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import HeaderButton from '../components/HeaderButton';
import EmptyState from '../components/EmptyState';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';
import { formatDate } from '../lib/format';
import { formatAmount } from '../lib/currency';
import { useCollection } from '../lib/useCollection';
import { autoInset } from '../lib/scrollProps';

const STATUS_LABELS = { completed: 'Complété', pending: 'En attente' };
const STATUS_COLORS = { completed: colors.success, pending: colors.warning };

export default function DonationsListScreen({ navigation }) {
  const { items, loading, refreshing, refresh, reload } = useCollection('donations', {
    sort: '-date_don',
    select: '*, membre_id(name)',
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderButton icon="add-circle" onPress={() => navigation.navigate('DonationForm')} />,
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <FlatList
        {...autoInset}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListHeaderComponent={
          <LinearGradient
            colors={[colors.module.donations, colors.rose]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.totalCard}
          >
            <Text style={styles.totalLabel}>Total des dons affichés</Text>
            <Text style={styles.totalValue}>{formatAmount(total)}</Text>
          </LinearGradient>
        }
        ListEmptyComponent={!loading ? <EmptyState title="Aucun don enregistré" /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.membre_id?.name || 'Anonyme'}
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
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  totalCard: {
    borderRadius: radius.lg,
    ...continuousCorner,
    padding: 20,
    marginBottom: 16,
    ...shadow.raised,
  },
  totalLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...continuousCorner,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.label,
  },
  cardAmount: {
    fontSize: 16,
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
    color: colors.secondaryLabel,
  },
});
