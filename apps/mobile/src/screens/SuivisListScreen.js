import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import SearchInput from '../components/SearchInput';
import ChipSelect from '../components/ChipSelect';
import Badge from '../components/Badge';
import HeaderButton from '../components/HeaderButton';
import SwipeableRow from '../components/SwipeableRow';
import EmptyState from '../components/EmptyState';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';
import { SUIVI_STATUSES, SUIVI_STATUS_COLORS } from '../lib/constants';
import { formatDate } from '../lib/format';
import { useCollection } from '../lib/useCollection';
import { autoInset } from '../lib/scrollProps';
import { usePeekMenu } from '../contexts/PeekMenuContext';
import pb from '../lib/pocketbase';

const FILTER_OPTIONS = ['Tous', ...SUIVI_STATUSES];

function SuiviRowContent({ item }) {
  const color = SUIVI_STATUS_COLORS[item.statut] || colors.primary;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.expand?.membre_id?.name || item.description || 'Sans nom'}
        </Text>
        <Badge label={item.statut} color={color} />
      </View>
      <Text style={styles.cardMeta} numberOfLines={1}>
        {item.type || 'Suivi'} · {formatDate(item.created)}
      </Text>
    </View>
  );
}

function SuiviRow({ item, onPress, onEdit, onDelete }) {
  const rowRef = useRef(null);
  const { showPeek } = usePeekMenu();

  const openPeek = () => {
    showPeek(
      rowRef.current,
      <SuiviRowContent item={item} />,
      [
        { label: 'Modifier', icon: 'create-outline', onPress: onEdit },
        { label: 'Supprimer', icon: 'trash-outline', destructive: true, onPress: onDelete },
      ],
      onPress
    );
  };

  return (
    <SwipeableRow onDelete={onDelete}>
      <TouchableOpacity ref={rowRef} activeOpacity={0.7} onPress={onPress} onLongPress={openPeek}>
        <SuiviRowContent item={item} />
      </TouchableOpacity>
    </SwipeableRow>
  );
}

export default function SuivisListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const { items, loading, refreshing, refresh, reload } = useCollection('suivis', {
    sort: '-created',
    expand: 'membre_id',
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderButton icon="add-circle" onPress={() => navigation.navigate('SuiviForm')} />,
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
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'Tous' || item.statut === statusFilter;
      const name = item.expand?.membre_id?.name || item.description || '';
      const matchesSearch = !q || name.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);

  const confirmDelete = (suivi) => {
    Alert.alert('Supprimer ce suivi ?', suivi.expand?.membre_id?.name || suivi.description, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await pb.collection('suivis').delete(suivi.id);
            reload();
          } catch (err) {
            Alert.alert('Erreur', 'La suppression a échoué.');
          }
        },
      },
    ]);
  };

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Rechercher un suivi..." />
      <ChipSelect
        options={FILTER_OPTIONS}
        value={statusFilter}
        onChange={setStatusFilter}
        colorFor={(option) => (option === 'Tous' ? colors.primary : SUIVI_STATUS_COLORS[option])}
      />
      <FlatList
        {...autoInset}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          !loading ? <EmptyState title="Aucun suivi" subtitle="Créez votre premier suivi." /> : null
        }
        renderItem={({ item }) => (
          <SuiviRow
            item={item}
            onPress={() => navigation.navigate('SuiviDetail', { id: item.id })}
            onEdit={() => navigation.navigate('SuiviForm', { id: item.id })}
            onDelete={() => confirmDelete(item)}
          />
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...continuousCorner,
    padding: 14,
    ...shadow.card,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.label,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.secondaryLabel,
  },
});
