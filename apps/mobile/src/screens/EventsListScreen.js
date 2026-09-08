import React, { useLayoutEffect, useRef } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import HeaderButton from '../components/HeaderButton';
import SwipeableRow from '../components/SwipeableRow';
import FadeInItem from '../components/FadeInItem';
import EmptyState from '../components/EmptyState';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from '../lib/constants';
import { formatDate } from '../lib/format';
import { useCollection } from '../lib/useCollection';
import { autoInset } from '../lib/scrollProps';
import { usePeekMenu } from '../contexts/PeekMenuContext';
import { supabase } from '../lib/supabase';

function EventRowContent({ item }) {
  const color = EVENT_STATUS_COLORS[item.statut] || colors.module.events;
  return (
    <View style={styles.card}>
      <View style={[styles.dateBox, { backgroundColor: `${color}1f` }]}>
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
      {item.statut ? <Badge label={EVENT_STATUS_LABELS[item.statut] || item.statut} color={color} /> : null}
    </View>
  );
}

function EventRow({ item, index, onPress, onEdit, onDelete }) {
  const rowRef = useRef(null);
  const { showPeek } = usePeekMenu();

  const openPeek = () => {
    showPeek(
      rowRef.current,
      <EventRowContent item={item} />,
      [
        { label: 'Modifier', icon: 'create-outline', onPress: onEdit },
        { label: 'Supprimer', icon: 'trash-outline', destructive: true, onPress: onDelete },
      ],
      onPress
    );
  };

  return (
    <FadeInItem index={index}>
      <SwipeableRow onDelete={onDelete}>
        <TouchableOpacity ref={rowRef} activeOpacity={0.7} onPress={onPress} onLongPress={openPeek}>
          <EventRowContent item={item} />
        </TouchableOpacity>
      </SwipeableRow>
    </FadeInItem>
  );
}

export default function EventsListScreen({ navigation }) {
  const { items, loading, refreshing, refresh, reload } = useCollection('evenements', {
    sort: '-date_debut',
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderButton icon="add-circle" onPress={() => navigation.navigate('EventForm')} />,
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const confirmDelete = (event) => {
    Alert.alert('Supprimer cet événement ?', event.titre, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('evenements').delete().eq('id', event.id);
            if (error) throw error;
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
      <FlatList
        {...autoInset}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          !loading ? <EmptyState title="Aucun événement" subtitle="Créez votre premier événement." /> : null
        }
        renderItem={({ item, index }) => (
          <EventRow
            item={item}
            index={index}
            onPress={() => navigation.navigate('EventDetail', { id: item.id })}
            onEdit={() => navigation.navigate('EventForm', { id: item.id })}
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
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...continuousCorner,
    padding: 12,
    gap: 12,
    ...shadow.card,
  },
  dateBox: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    ...continuousCorner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 17,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.label,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
});
