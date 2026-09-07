import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import GroupedSection from '../components/GroupedSection';
import FormRow from '../components/FormRow';
import Row from '../components/Row';
import ChipSelect from '../components/ChipSelect';
import HeaderButton from '../components/HeaderButton';
import { colors } from '../theme/colors';
import { SUIVI_PRIORITY_COLORS, SUIVI_STATUS_COLORS, SUIVI_STATUSES } from '../lib/constants';
import pb from '../lib/pocketbase';
import { autoInset } from '../lib/scrollProps';

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
        await pb.collection('suivis').create({ ...form, created_by: pb.authStore.record.id });
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
      title: id ? 'Modifier' : 'Nouveau suivi',
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

  if (loading) return <Screen edges={['bottom', 'left', 'right']} />;

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" {...autoInset}>
          <GroupedSection>
            <Row label="Membre concerné" value={memberName} placeholder="Choisir" onPress={openMemberPicker} />
            <FormRow label="Description" value={form.description} onChangeText={setField('description')} placeholder="Sujet du suivi" />
          </GroupedSection>

          <GroupedSection title="Type">
            <ChipSelect options={TYPE_OPTIONS} value={form.type} onChange={setField('type')} inset />
          </GroupedSection>

          <GroupedSection title="Statut">
            <ChipSelect options={SUIVI_STATUSES} value={form.statut} onChange={setField('statut')} colorFor={(option) => SUIVI_STATUS_COLORS[option]} inset />
          </GroupedSection>

          <GroupedSection title="Priorité">
            <ChipSelect options={PRIORITY_OPTIONS} value={form.priorite} onChange={setField('priorite')} colorFor={(option) => SUIVI_PRIORITY_COLORS[option]} inset />
          </GroupedSection>

          <GroupedSection title="Notes">
            <FormRow value={form.notes} onChangeText={setField('notes')} placeholder="Notes de suivi..." multiline />
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
