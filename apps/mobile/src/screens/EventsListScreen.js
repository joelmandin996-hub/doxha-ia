import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { colors, radius } from '../theme/colors';
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from '../lib/constants';
import { formatDate } from '../lib/format';
import { useCollection } from '../lib/useCollection';

export default function EventsListScreen({ navigation }) {
  const { items, loading, refreshing, refresh, reload } = useCollection('evenements', {
    sort: '-date_debut',
  });

  useFocusEffect(
    React.useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Événements</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('EventForm')}>
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          !loading ? <EmptyState title="Aucun événement" subtitle="Créez votre premier événement." /> : null
        }
        renderItem={({ item }) => {
          const color = EVENT_STATUS_COLORS[item.statut] || colors.module.events;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('EventDetail', { id: item.id })}
            >
              <View style={[styles.dateBox, { backgroundColor: `${color}1a` }]}>
                <Text style={[styles.dateDay, { color }]}>{formatDate(item.date_debut, 'd')}</Text>
                <Text style={[styles.dateMonth, { color }]}>{formatDate(item.date_debut, 'MMM')}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.titre}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.categorie || 'Événement'} {item.lieu ? `· ${item.lieu}` : ''}
                </Text>
              </View>
              {item.statut ? (
                <Badge label={EVENT_STATUS_LABELS[item.statut] || item.statut} color={color} />
              ) : null}
            </TouchableOpacity>
          );
        }}
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    gap: 12,
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 16,
    fontWeight: '800',
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
