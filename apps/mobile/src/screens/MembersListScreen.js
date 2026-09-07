import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import SearchInput from '../components/SearchInput';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { colors, radius } from '../theme/colors';
import { MEMBER_STATUS_COLORS } from '../lib/constants';
import { useCollection } from '../lib/useCollection';

export default function MembersListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const { items, loading, refreshing, refresh, reload } = useCollection('members', {
    sort: 'name',
  });

  useFocusEffect(
    React.useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (m) => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Membres</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('MemberForm')}>
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Rechercher un membre..." />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="Aucun membre"
              subtitle={search ? 'Aucun résultat pour cette recherche.' : 'Ajoutez votre premier membre.'}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('MemberDetail', { id: item.id })}
          >
            <Avatar name={item.name} color={MEMBER_STATUS_COLORS[item.status] || colors.primary} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {item.email || item.phone || '—'}
              </Text>
            </View>
            {item.status ? (
              <Badge label={item.status} color={MEMBER_STATUS_COLORS[item.status] || colors.primary} />
            ) : null}
          </TouchableOpacity>
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
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
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  rowMeta: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
