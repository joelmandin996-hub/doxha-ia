import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import FormField from '../components/FormField';
import ChipSelect from '../components/ChipSelect';
import PickerField from '../components/PickerField';
import PrimaryButton from '../components/PrimaryButton';
import { SUIVI_PRIORITY_COLORS, SUIVI_STATUS_COLORS, SUIVI_STATUSES } from '../lib/constants';
import pb from '../lib/pocketbase';

const TYPE_OPTIONS = [
  'Nouveau membre',
  'Suivi pastoral',
  'Demande de prière',
  'Membre absent',
  'Bénévole',
  'Formation',
  'Donateur',
  'Famille',
  'Jeunesse',
  'Visite',
  'Appel',
  'Rencontre',
  'Autre',
];

const PRIORITY_OPTIONS = Object.keys(SUIVI_PRIORITY_COLORS);

export default function SuiviFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const [form, setForm] = useState({
    membre_id: '',
    description: '',
    type: TYPE_OPTIONS[0],
    statut: SUIVI_STATUSES[0],
    priorite: 'normal',
    notes: '',
  });
  const [memberName, setMemberName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    navigation.setOptions({ title: id ? 'Modifier le suivi' : 'Nouveau suivi' });
  }, [navigation, id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const record = await pb.collection('suivis').getOne(id, { expand: 'membre_id' });
        setForm({
          membre_id: record.membre_id || '',
          description: record.description || '',
          type: record.type || TYPE_OPTIONS[0],
          statut: record.statut || SUIVI_STATUSES[0],
          priorite: record.priorite || 'normal',
          notes: record.notes || '',
        });
        setMemberName(record.expand?.membre_id?.name || '');
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger ce suivi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openMemberPicker = () => {
    navigation.navigate('MemberPicker', {
      onSelect: (member) => {
        setField('membre_id')(member.id);
        setMemberName(member.name);
      },
    });
  };

  const handleSave = async () => {
    if (!form.description.trim() && !form.membre_id) {
      Alert.alert('Champ requis', 'Renseignez un membre ou une description.');
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await pb.collection('suivis').update(id, form);
      } else {
        await pb.collection('suivis').create(form);
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
          <PickerField label="Membre concerné" value={memberName} onPress={openMemberPicker} />
          <FormField
            label="Description"
            value={form.description}
            onChangeText={setField('description')}
            placeholder="Sujet du suivi"
          />
          <ChipSelect label="Type" options={TYPE_OPTIONS} value={form.type} onChange={setField('type')} />
          <ChipSelect
            label="Statut"
            options={SUIVI_STATUSES}
            value={form.statut}
            onChange={setField('statut')}
            colorFor={(option) => SUIVI_STATUS_COLORS[option]}
          />
          <ChipSelect
            label="Priorité"
            options={PRIORITY_OPTIONS}
            value={form.priorite}
            onChange={setField('priorite')}
            colorFor={(option) => SUIVI_PRIORITY_COLORS[option]}
          />
          <FormField
            label="Notes"
            value={form.notes}
            onChangeText={setField('notes')}
            placeholder="Notes de suivi..."
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
