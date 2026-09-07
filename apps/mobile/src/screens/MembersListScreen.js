import React, { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import SearchInput from '../components/SearchInput';
import HeaderButton from '../components/HeaderButton';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';
import { MEMBER_STATUS_COLORS } from '../lib/constants';
import { useCollection } from '../lib/useCollection';
import { autoInset } from '../lib/scrollProps';

export default function MembersListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const { items, loading, refreshing, refresh, reload } = useCollection('members', {
    sort: 'name',
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderButton icon="add-circle" onPress={() => navigation.navigate('MemberForm')} />,
    });
  }, [navigation]);

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
    <Screen edges={['bottom', 'left', 'right']}>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Rechercher un membre..." />
      <FlatList
        {...autoInset}
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
            activeOpacity={0.7}
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
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...continuousCorner,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    ...shadow.card,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.label,
  },
  rowMeta: {
    fontSize: 13,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
});
