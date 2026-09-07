import React, { useLayoutEffect } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import HeaderButton from '../components/HeaderButton';
import SwipeableRow from '../components/SwipeableRow';
import EmptyState from '../components/EmptyState';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';
import { GROUP_TYPE_COLORS } from '../lib/constants';
import { useCollection } from '../lib/useCollection';
import { autoInset } from '../lib/scrollProps';
import { showItemActions } from '../lib/actionSheet';
import pb from '../lib/pocketbase';

export default function GroupsListScreen({ navigation }) {
  const { items, loading, refreshing, refresh, reload } = useCollection('groups', {
    sort: 'name',
    expand: 'responsible',
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderButton icon="add-circle" onPress={() => navigation.navigate('GroupForm')} />,
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const confirmDelete = (group) => {
    Alert.alert('Supprimer ce groupe ?', group.name, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await pb.collection('groups').delete(group.id);
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
          !loading ? <EmptyState title="Aucun groupe" subtitle="Créez votre premier groupe." /> : null
        }
        renderItem={({ item }) => {
          const color = GROUP_TYPE_COLORS[item.type] || colors.secondary;
          return (
            <SwipeableRow onDelete={() => confirmDelete(item)}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('GroupDetail', { id: item.id })}
                onLongPress={() =>
                  showItemActions({
                    title: item.name,
                    onEdit: () => navigation.navigate('GroupForm', { id: item.id }),
                    onDelete: () => confirmDelete(item),
                  })
                }
              >
                <View style={[styles.iconWrap, { backgroundColor: `${color}1f` }]}>
                  <Ionicons name="people" size={20} color={color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {item.expand?.responsible?.name ? `Responsable : ${item.expand.responsible.name}` : 'Sans responsable'}
                  </Text>
                </View>
                {item.type ? <Badge label={item.type} color={color} /> : null}
              </TouchableOpacity>
            </SwipeableRow>
          );
        }}
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    ...continuousCorner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
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
