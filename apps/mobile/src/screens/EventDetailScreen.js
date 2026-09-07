import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import { colors, radius } from '../theme/colors';
import { formatDate } from '../lib/format';
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from '../lib/constants';
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

export default function EventDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const record = await pb.collection('evenements').getOne(id, { expand: 'responsable' });
      setEvent(record);
    } catch (err) {
      Alert.alert('Erreur', "Impossible de charger cet événement.");
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
    Alert.alert('Supprimer cet événement ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await pb.collection('evenements').delete(id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Erreur', 'La suppression a échoué.');
          }
        },
      },
    ]);
  };

  if (loading || !event) return <Screen />;

  const color = EVENT_STATUS_COLORS[event.statut] || colors.module.events;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{event.titre}</Text>
          {event.statut ? (
            <Badge label={EVENT_STATUS_LABELS[event.statut] || event.statut} color={color} />
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EventForm', { id: event.id })}
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
          <InfoRow icon="pricetag-outline" label="Catégorie" value={event.categorie} />
          <InfoRow icon="calendar-outline" label="Début" value={formatDate(event.date_debut, "d MMM yyyy 'à' HH:mm")} />
          <InfoRow icon="calendar-outline" label="Fin" value={formatDate(event.date_fin, "d MMM yyyy 'à' HH:mm")} />
          <InfoRow icon="location-outline" label="Lieu" value={event.lieu} />
          <InfoRow icon="person-outline" label="Responsable" value={event.expand?.responsable?.name} />
          <InfoRow icon="people-outline" label="Capacité max" value={event.capacite_max ? String(event.capacite_max) : null} />
        </View>

        {event.description ? (
          <View style={styles.card}>
            <Text style={styles.notesLabel}>Description</Text>
            <Text style={styles.notesText}>{event.description}</Text>
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
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 22,
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
