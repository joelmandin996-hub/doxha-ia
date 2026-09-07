import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import SearchInput from '../components/SearchInput';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';
import { useCollection } from '../lib/useCollection';

// Generic "pick a member" screen used by group/suivi/donation forms.
// The caller passes onSelect(member) via route params.
export default function MemberPickerScreen({ route, navigation }) {
  const { onSelect } = route.params || {};
  const [search, setSearch] = useState('');
  const { items, loading } = useCollection('members', { sort: 'name' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => m.name?.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <Screen>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Rechercher un membre..." />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? <EmptyState title="Aucun membre trouvé" /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              onSelect?.(item);
              navigation.goBack();
            }}
          >
            <Avatar name={item.name} size={36} />
            <Text style={styles.rowName} numberOfLines={1}>
              {item.name}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    color: colors.foreground,
  },
});
