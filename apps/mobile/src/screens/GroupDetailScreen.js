import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { colors, radius } from '../theme/colors';
import { GROUP_TYPE_COLORS } from '../lib/constants';
import pb from '../lib/pocketbase';

export default function GroupDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const record = await pb.collection('groups').getOne(id, { expand: 'responsible' });
      setGroup(record);
      const links = await pb.collection('group_members').getFullList({
        filter: `group_id = "${id}"`,
        expand: 'member_id',
      });
      setMembers(links.map((link) => link.expand?.member_id).filter(Boolean));
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger ce groupe.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = () => {
    Alert.alert('Supprimer ce groupe ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await pb.collection('groups').delete(id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Erreur', 'La suppression a échoué.');
          }
        },
      },
    ]);
  };

  if (loading || !group) return <Screen />;

  const color = GROUP_TYPE_COLORS[group.type] || colors.secondary;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: `${color}1a` }]}>
            <Ionicons name="people" size={28} color={color} />
          </View>
          <Text style={styles.name}>{group.name}</Text>
          {group.type ? <Badge label={group.type} color={color} /> : null}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('GroupForm', { id: group.id })}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>

        {group.description ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description</Text>
            <Text style={styles.cardText}>{group.description}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Responsable</Text>
          <Text style={styles.cardText}>{group.expand?.responsible?.name || 'Aucun responsable assigné'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Membres ({members.length})</Text>
        {members.length === 0 ? (
          <EmptyState title="Aucun membre" subtitle="Ce groupe n'a pas encore de membres." />
        ) : (
          members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <Avatar name={member.name} size={36} />
              <Text style={styles.memberName} numberOfLines={1}>
                {member.name}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 15,
    color: colors.foreground,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  memberName: {
    fontSize: 14,
    color: colors.foreground,
    flex: 1,
  },
});
