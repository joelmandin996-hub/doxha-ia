import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import GroupedSection from '../components/GroupedSection';
import Row from '../components/Row';
import HeaderButton from '../components/HeaderButton';
import { colors } from '../theme/colors';
import { formatDate } from '../lib/format';
import { MEMBER_STATUS_COLORS } from '../lib/constants';
import pb from '../lib/pocketbase';
import { autoInset } from '../lib/scrollProps';

export default function MemberDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const record = await pb.collection('members').getOne(id);
      setMember(record);
    } catch (err) {
      Alert.alert('Erreur', "Impossible de charger ce membre.");
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
        <HeaderButton label="Modifier" bold onPress={() => navigation.navigate('MemberForm', { id })} />
      ),
    });
  }, [navigation, id]);

  const handleDelete = () => {
    Alert.alert('Supprimer ce membre ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await pb.collection('members').delete(id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Erreur', 'La suppression a échoué.');
          }
        },
      },
    ]);
  };

  if (loading || !member) {
    return <Screen edges={['bottom', 'left', 'right']} />;
  }

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} {...autoInset}>
        <View style={styles.hero}>
          <Avatar name={member.name} size={80} color={MEMBER_STATUS_COLORS[member.status] || colors.primary} />
          <Text style={styles.name}>{member.name}</Text>
          {member.status ? (
            <Badge label={member.status} color={MEMBER_STATUS_COLORS[member.status] || colors.primary} />
          ) : null}
        </View>

        <GroupedSection>
          {member.email ? <Row icon="mail-outline" iconColor={colors.sky} label="Email" value={member.email} /> : null}
          {member.phone ? <Row icon="call-outline" iconColor={colors.emerald} label="Téléphone" value={member.phone} /> : null}
          {member.address ? <Row icon="location-outline" iconColor={colors.coral} label="Adresse" value={member.address} /> : null}
        </GroupedSection>

        <GroupedSection title="Dates clés">
          <Row icon="calendar-outline" iconColor={colors.amber} label="Membre depuis" value={formatDate(member.join_date)} />
          {member.baptism_date ? (
            <Row icon="water-outline" iconColor={colors.primary} label="Baptême" value={formatDate(member.baptism_date)} />
          ) : null}
        </GroupedSection>

        {member.notes ? (
          <GroupedSection title="Notes">
            <View style={styles.notesRow}>
              <Text style={styles.notesText}>{member.notes}</Text>
            </View>
          </GroupedSection>
        ) : null}

        {member.phone ? (
          <GroupedSection>
            <Row
              icon="chatbubble-outline"
              iconColor={colors.module.comm}
              label="Envoyer un SMS"
              onPress={() => navigation.navigate('SmsCompose', { name: member.name, phone: member.phone })}
            />
          </GroupedSection>
        ) : null}

        <GroupedSection>
          <Row label="Supprimer le membre" danger onPress={handleDelete} />
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
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.label,
  },
  notesRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notesText: {
    fontSize: 15,
    color: colors.label,
    lineHeight: 21,
  },
});
