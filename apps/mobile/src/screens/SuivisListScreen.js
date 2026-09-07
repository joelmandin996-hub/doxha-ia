import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import SearchInput from '../components/SearchInput';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { colors, radius } from '../theme/colors';
import { SUIVI_STATUSES, SUIVI_STATUS_COLORS } from '../lib/constants';
import { formatDate } from '../lib/format';
import { useCollection } from '../lib/useCollection';

export default function SuivisListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const { items, loading, refreshing, refresh, reload } = useCollection('suivis', {
    sort: '-created',
    expand: 'membre_id',
  });

  useFocusEffect(
    React.useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'Tous' || item.statut === statusFilter;
      const name = item.expand?.membre_id?.name || item.description || '';
      const matchesSearch = !q || name.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Suivis</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('SuiviForm')}>
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Rechercher un suivi..." />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['Tous', ...SUIVI_STATUSES]}
        keyExtractor={(item) => item}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
        renderItem={({ item }) => {
          const selected = item === statusFilter;
          const color = SUIVI_STATUS_COLORS[item] || colors.primary;
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                { borderColor: selected ? color : colors.border },
                selected && { backgroundColor: `${color}1a` },
              ]}
              onPress={() => setStatusFilter(item)}
            >
              <Text style={[styles.filterChipText, selected && { color, fontWeight: '700' }]}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          !loading ? <EmptyState title="Aucun suivi" subtitle="Créez votre premier suivi." /> : null
        }
        renderItem={({ item }) => {
          const color = SUIVI_STATUS_COLORS[item.statut] || colors.primary;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('SuiviDetail', { id: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.expand?.membre_id?.name || item.description || 'Sans nom'}
                </Text>
                <Badge label={item.statut} color={color} />
              </View>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.type || 'Suivi'} · {formatDate(item.created)}
              </Text>
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
    paddingBottom: 8,
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
  filterRow: {
    flexGrow: 0,
    marginBottom: 12,
  },
  filterRowContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.mutedForeground,
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
    marginBottom: 6,
  },
  cardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
});
