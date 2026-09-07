import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import GroupedSection from '../components/GroupedSection';
import FormRow from '../components/FormRow';
import Row from '../components/Row';
import ChipSelect from '../components/ChipSelect';
import DateField from '../components/DateField';
import HeaderButton from '../components/HeaderButton';
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from '../lib/constants';
import { colors } from '../theme/colors';
import pb from '../lib/pocketbase';
import { autoInset } from '../lib/scrollProps';

const CATEGORY_OPTIONS = [
  "Réunion de prière",
  'Cellule de maison',
  "Prédication spéciale",
  'Louange & Adoration',
  "Vie d'Église",
  'Formation biblique',
  'Jeunesse',
  'Enfants',
  'Baptême',
  'Visite pastorale',
  'Événement spécial',
  'Repas fraternel',
  'Conférence',
];

const STATUS_OPTIONS = Object.keys(EVENT_STATUS_COLORS);

export default function EventFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const [form, setForm] = useState({
    titre: '',
    description: '',
    categorie: CATEGORY_OPTIONS[0],
    lieu: '',
    responsable: '',
    date_debut: new Date().toISOString(),
    date_fin: new Date().toISOString(),
    statut: 'a_venir',
    capacite_max: '',
  });
  const [responsableName, setResponsableName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openResponsablePicker = () => {
    navigation.navigate('MemberPicker', {
      onSelect: (member) => {
        setField('responsable')(member.id);
        setResponsableName(member.name);
      },
    });
  };

  const handleSave = async () => {
    if (!form.titre.trim()) {
      Alert.alert('Titre requis', "Veuillez renseigner le titre de l'événement.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        capacite_max: form.capacite_max ? Number(form.capacite_max) : 0,
      };
      if (id) {
        await pb.collection('evenements').update(id, payload);
      } else {
        await pb.collection('evenements').create({ ...payload, created_by: pb.authStore.record.id });
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erreur', "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: id ? "Modifier" : 'Nouvel événement',
      headerLeft: () => <HeaderButton label="Annuler" onPress={() => navigation.goBack()} />,
      headerRight: () => (
        <HeaderButton
          label="Enregistrer"
          bold
          color={saving ? colors.tertiaryLabel : colors.primary}
          onPress={saving ? undefined : handleSave}
        />
      ),
    });
  }, [navigation, id, form, saving]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const record = await pb.collection('evenements').getOne(id, { expand: 'responsable' });
        setForm({
          titre: record.titre || '',
          description: record.description || '',
          categorie: record.categorie || CATEGORY_OPTIONS[0],
          lieu: record.lieu || '',
          responsable: record.responsable || '',
          date_debut: record.date_debut || new Date().toISOString(),
          date_fin: record.date_fin || new Date().toISOString(),
          statut: record.statut || 'a_venir',
          capacite_max: record.capacite_max ? String(record.capacite_max) : '',
        });
        setResponsableName(record.expand?.responsable?.name || '');
      } catch (err) {
        Alert.alert('Erreur', "Impossible de charger cet événement.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Screen edges={['bottom', 'left', 'right']} />;

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" {...autoInset}>
          <GroupedSection>
            <FormRow label="Titre" value={form.titre} onChangeText={setField('titre')} placeholder="Culte du dimanche" />
            <FormRow label="Lieu" value={form.lieu} onChangeText={setField('lieu')} placeholder="Salle principale" />
          </GroupedSection>

          <GroupedSection title="Catégorie">
            <ChipSelect options={CATEGORY_OPTIONS} value={form.categorie} onChange={setField('categorie')} inset />
          </GroupedSection>

          <GroupedSection title="Horaires">
            <DateField label="Début" value={form.date_debut} onChange={setField('date_debut')} />
            <DateField label="Fin" value={form.date_fin} onChange={setField('date_fin')} />
          </GroupedSection>

          <GroupedSection>
            <Row label="Responsable" value={responsableName} placeholder="Aucun" onPress={openResponsablePicker} />
            <FormRow
              label="Capacité max"
              value={form.capacite_max}
              onChangeText={setField('capacite_max')}
              placeholder="0"
              keyboardType="number-pad"
            />
          </GroupedSection>

          <GroupedSection title="Statut">
            <ChipSelect
              options={STATUS_OPTIONS}
              value={form.statut}
              onChange={setField('statut')}
              colorFor={(option) => EVENT_STATUS_COLORS[option]}
              labelFor={(option) => EVENT_STATUS_LABELS[option] || option}
              inset
            />
          </GroupedSection>

          <GroupedSection title="Description">
            <FormRow value={form.description} onChangeText={setField('description')} placeholder="Détails de l'événement..." multiline />
          </GroupedSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
});
