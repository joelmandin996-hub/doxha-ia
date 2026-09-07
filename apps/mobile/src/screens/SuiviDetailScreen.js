import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import ChipSelect from '../components/ChipSelect';
import { colors, radius } from '../theme/colors';
import { formatDate } from '../lib/format';
import { SUIVI_PRIORITY_COLORS, SUIVI_STATUSES, SUIVI_STATUS_COLORS } from '../lib/constants';
import pb from '../lib/pocketbase';

export default function SuiviDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [suivi, setSuivi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const record = await pb.collection('suivis').getOne(id, { expand: 'membre_id' });
      setSuivi(record);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger ce suivi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleStatusChange = async (statut) => {
    setUpdatingStatus(true);
    try {
      const record = await pb.collection('suivis').update(id, { statut });
      setSuivi((prev) => ({ ...prev, statut: record.statut }));
    } catch (err) {
      Alert.alert('Erreur', 'La mise à jour du statut a échoué.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Supprimer ce suivi ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await pb.collection('suivis').delete(id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Erreur', 'La suppression a échoué.');
          }
        },
      },
    ]);
  };

  if (loading || !suivi) return <Screen />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.name}>{suivi.expand?.membre_id?.name || suivi.description || 'Sans nom'}</Text>
          <View style={styles.badgeRow}>
            <Badge label={suivi.type || 'Suivi'} color={colors.module.followups} />
            {suivi.priorite ? (
              <Badge label={suivi.priorite} color={SUIVI_PRIORITY_COLORS[suivi.priorite] || colors.amber} />
            ) : null}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SuiviForm', { id: suivi.id })}
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
          <Text style={styles.cardLabel}>Statut</Text>
          <ChipSelect
            options={SUIVI_STATUSES}
            value={suivi.statut}
            onChange={handleStatusChange}
            colorFor={(option) => SUIVI_STATUS_COLORS[option]}
          />
          {updatingStatus ? <Text style={styles.updating}>Mise à jour...</Text> : null}
        </View>

        {suivi.sous_rubrique ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Sous-rubrique</Text>
            <Text style={styles.cardText}>{suivi.sous_rubrique}</Text>
          </View>
        ) : null}

        {suivi.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Notes</Text>
            <Text style={styles.cardText}>{suivi.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.createdAt}>Créé le {formatDate(suivi.created)}</Text>
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
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
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
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 20,
  },
  updating: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  createdAt: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
