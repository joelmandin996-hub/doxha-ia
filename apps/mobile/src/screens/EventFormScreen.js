import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import FormField from '../components/FormField';
import ChipSelect from '../components/ChipSelect';
import PickerField from '../components/PickerField';
import DateField from '../components/DateField';
import PrimaryButton from '../components/PrimaryButton';
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from '../lib/constants';
import { colors } from '../theme/colors';
import pb from '../lib/pocketbase';

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

  useEffect(() => {
    navigation.setOptions({ title: id ? "Modifier l'événement" : 'Nouvel événement' });
  }, [navigation, id]);

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
        await pb.collection('evenements').create(payload);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erreur', "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen />;

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <FormField label="Titre" value={form.titre} onChangeText={setField('titre')} placeholder="Culte du dimanche" />
          <ChipSelect label="Catégorie" options={CATEGORY_OPTIONS} value={form.categorie} onChange={setField('categorie')} />
          <DateField label="Date de début" value={form.date_debut} onChange={setField('date_debut')} />
          <DateField label="Date de fin" value={form.date_fin} onChange={setField('date_fin')} />
          <FormField label="Lieu" value={form.lieu} onChangeText={setField('lieu')} placeholder="Salle principale" />
          <PickerField label="Responsable" value={responsableName} onPress={openResponsablePicker} />
          <FormField
            label="Capacité max"
            value={form.capacite_max}
            onChangeText={setField('capacite_max')}
            placeholder="0"
            keyboardType="number-pad"
          />
          <ChipSelect
            label="Statut"
            options={STATUS_OPTIONS}
            value={form.statut}
            onChange={setField('statut')}
            colorFor={(option) => EVENT_STATUS_COLORS[option]}
            labelFor={(option) => EVENT_STATUS_LABELS[option] || option}
          />
          <FormField
            label="Description"
            value={form.description}
            onChangeText={setField('description')}
            placeholder="Détails de l'événement..."
            multiline
          />
          <PrimaryButton label="Enregistrer" onPress={handleSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
});
