import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import ChipSelect from '../components/ChipSelect';
import GroupedSection from '../components/GroupedSection';
import Row from '../components/Row';
import HeaderButton from '../components/HeaderButton';
import { colors } from '../theme/colors';
import { formatDate } from '../lib/format';
import { SUIVI_PRIORITY_COLORS, SUIVI_STATUSES, SUIVI_STATUS_COLORS } from '../lib/constants';
import pb from '../lib/pocketbase';
import { autoInset } from '../lib/scrollProps';

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton label="Modifier" bold onPress={() => navigation.navigate('SuiviForm', { id })} />
      ),
    });
  }, [navigation, id]);

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

  if (loading || !suivi) return <Screen edges={['bottom', 'left', 'right']} />;

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} {...autoInset}>
        <View style={styles.hero}>
          <Text style={styles.name}>{suivi.expand?.membre_id?.name || suivi.description || 'Sans nom'}</Text>
          <View style={styles.badgeRow}>
            <Badge label={suivi.type || 'Suivi'} color={colors.module.followups} />
            {suivi.priorite ? (
              <Badge label={suivi.priorite} color={SUIVI_PRIORITY_COLORS[suivi.priorite] || colors.amber} />
            ) : null}
          </View>
        </View>

        <GroupedSection title="Statut" footer={updatingStatus ? 'Mise à jour...' : undefined}>
          <ChipSelect options={SUIVI_STATUSES} value={suivi.statut} onChange={handleStatusChange} colorFor={(option) => SUIVI_STATUS_COLORS[option]} inset />
        </GroupedSection>

        {suivi.sous_rubrique ? (
          <GroupedSection>
            <Row label="Sous-rubrique" value={suivi.sous_rubrique} />
          </GroupedSection>
        ) : null}

        {suivi.notes ? (
          <GroupedSection title="Notes">
            <View style={styles.textRow}>
              <Text style={styles.textRowValue}>{suivi.notes}</Text>
            </View>
          </GroupedSection>
        ) : null}

        <Text style={styles.createdAt}>Créé le {formatDate(suivi.created)}</Text>

        <GroupedSection>
          <Row label="Supprimer le suivi" danger onPress={handleDelete} />
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
    marginBottom: 20,
    gap: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.label,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
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
  createdAt: {
    fontSize: 13,
    color: colors.secondaryLabel,
    textAlign: 'center',
    marginBottom: 20,
  },
});
