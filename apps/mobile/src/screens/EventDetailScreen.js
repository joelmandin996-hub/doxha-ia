import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import GroupedSection from '../components/GroupedSection';
import Row from '../components/Row';
import HeaderButton from '../components/HeaderButton';
import { colors } from '../theme/colors';
import { formatDate } from '../lib/format';
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { autoInset } from '../lib/scrollProps';

export default function EventDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: record, error } = await supabase
        .from('evenements')
        .select('*, responsable(name)')
        .eq('id', id)
        .single();
      if (error) throw error;
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton label="Modifier" bold onPress={() => navigation.navigate('EventForm', { id })} />
      ),
    });
  }, [navigation, id]);

  const handleDelete = () => {
    Alert.alert('Supprimer cet événement ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('evenements').delete().eq('id', id);
            if (error) throw error;
            navigation.goBack();
          } catch (err) {
            Alert.alert('Erreur', 'La suppression a échoué.');
          }
        },
      },
    ]);
  };

  if (loading || !event) return <Screen edges={['bottom', 'left', 'right']} />;

  const color = EVENT_STATUS_COLORS[event.statut] || colors.module.events;

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} {...autoInset}>
        <View style={styles.hero}>
          <Text style={styles.title}>{event.titre}</Text>
          {event.statut ? (
            <Badge label={EVENT_STATUS_LABELS[event.statut] || event.statut} color={color} />
          ) : null}
        </View>

        <GroupedSection>
          <Row icon="pricetag-outline" iconColor={colors.module.events} label="Catégorie" value={event.categorie} />
          <Row icon="calendar-outline" iconColor={colors.amber} label="Début" value={formatDate(event.date_debut, "d MMM yyyy 'à' HH:mm")} />
          <Row icon="calendar-outline" iconColor={colors.amber} label="Fin" value={formatDate(event.date_fin, "d MMM yyyy 'à' HH:mm")} />
          <Row icon="location-outline" iconColor={colors.coral} label="Lieu" value={event.lieu} placeholder="—" />
          <Row icon="person-outline" iconColor={colors.primary} label="Responsable" value={event.responsable?.name} placeholder="Aucun" />
          {event.capacite_max ? (
            <Row icon="people-outline" iconColor={colors.sky} label="Capacité max" value={String(event.capacite_max)} />
          ) : null}
        </GroupedSection>

        {event.description ? (
          <GroupedSection title="Description">
            <View style={styles.textRow}>
              <Text style={styles.textRowValue}>{event.description}</Text>
            </View>
          </GroupedSection>
        ) : null}

        <GroupedSection>
          <Row label="Supprimer l'événement" danger onPress={handleDelete} />
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
    gap: 8,
  },
  title: {
    fontSize: 24,
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
});
