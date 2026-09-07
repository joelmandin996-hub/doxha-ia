import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { colors, radius } from '../theme/colors';
import { GROUP_TYPE_COLORS } from '../lib/constants';
import { useCollection } from '../lib/useCollection';

export default function GroupsListScreen({ navigation }) {
  const { items, loading, refreshing, refresh, reload } = useCollection('groups', {
    sort: 'name',
    expand: 'responsible',
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
        <Text style={styles.title}>Groupes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('GroupForm')}>
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
      <FlatList
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
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('GroupDetail', { id: item.id })}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${color}1a` }]}>
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
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
