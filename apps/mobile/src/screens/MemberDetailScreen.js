import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { colors, radius } from '../theme/colors';
import { formatDate } from '../lib/format';
import { MEMBER_STATUS_COLORS } from '../lib/constants';
import pb from '../lib/pocketbase';

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.mutedForeground} style={styles.infoIcon} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

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
    return <Screen />;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Avatar name={member.name} size={64} color={MEMBER_STATUS_COLORS[member.status] || colors.primary} />
          <Text style={styles.name}>{member.name}</Text>
          {member.status ? (
            <Badge label={member.status} color={MEMBER_STATUS_COLORS[member.status] || colors.primary} />
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MemberForm', { id: member.id })}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <InfoRow icon="mail-outline" label="Email" value={member.email} />
          <InfoRow icon="call-outline" label="Téléphone" value={member.phone} />
          <InfoRow icon="location-outline" label="Adresse" value={member.address} />
          <InfoRow icon="calendar-outline" label="Membre depuis" value={formatDate(member.join_date)} />
          <InfoRow icon="water-outline" label="Date de baptême" value={formatDate(member.baptism_date)} />
        </View>

        {member.notes ? (
          <View style={styles.card}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{member.notes}</Text>
          </View>
        ) : null}
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  infoValue: {
    fontSize: 15,
    color: colors.foreground,
    marginTop: 1,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
});
