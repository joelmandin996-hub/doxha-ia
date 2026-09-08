import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import GroupedSection from '../components/GroupedSection';
import Row from '../components/Row';
import HeaderButton from '../components/HeaderButton';
import EmptyState from '../components/EmptyState';
import { colors, continuousCorner, radius } from '../theme/colors';
import { GROUP_TYPE_COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { autoInset } from '../lib/scrollProps';

export default function GroupDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: record, error } = await supabase
        .from('groups')
        .select('*, responsible(name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      setGroup(record);
      const { data: links, error: linksError } = await supabase
        .from('group_members')
        .select('member_id(id, name)')
        .eq('group_id', id);
      if (linksError) throw linksError;
      setMembers(links.map((link) => link.member_id).filter(Boolean));
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton label="Modifier" bold onPress={() => navigation.navigate('GroupForm', { id })} />
      ),
    });
  }, [navigation, id]);

  const handleDelete = () => {
    Alert.alert('Supprimer ce groupe ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('groups').delete().eq('id', id);
            if (error) throw error;
            navigation.goBack();
          } catch (err) {
            Alert.alert('Erreur', 'La suppression a échoué.');
          }
        },
      },
    ]);
  };

  if (loading || !group) return <Screen edges={['bottom', 'left', 'right']} />;

  const color = GROUP_TYPE_COLORS[group.type] || colors.secondary;

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} {...autoInset}>
        <View style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: `${color}1f` }]}>
            <Ionicons name="people" size={30} color={color} />
          </View>
          <Text style={styles.name}>{group.name}</Text>
          {group.type ? <Badge label={group.type} color={color} /> : null}
        </View>

        <GroupedSection>
          <Row icon="person-outline" iconColor={colors.primary} label="Responsable" value={group.responsible?.name} placeholder="Aucun" />
        </GroupedSection>

        {group.description ? (
          <GroupedSection title="Description">
            <View style={styles.textRow}>
              <Text style={styles.textRowValue}>{group.description}</Text>
            </View>
          </GroupedSection>
        ) : null}

        <GroupedSection title={`Membres (${members.length})`}>
          {members.length === 0 ? (
            <View style={styles.emptyRow}>
              <EmptyState title="Aucun membre" subtitle="Ce groupe n'a pas encore de membres." />
            </View>
          ) : (
            members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <Avatar name={member.name} size={32} />
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.name}
                </Text>
              </View>
            ))
          )}
        </GroupedSection>

        <GroupedSection>
          <Row label="Supprimer le groupe" danger onPress={handleDelete} />
        </GroupedSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    ...continuousCorner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.label,
  },
  textRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textRowValue: {
    fontSize: 15,
    color: colors.label,
    lineHeight: 21,
  },
  emptyRow: {
    paddingVertical: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  memberName: {
    fontSize: 16,
    color: colors.label,
    flex: 1,
  },
});
