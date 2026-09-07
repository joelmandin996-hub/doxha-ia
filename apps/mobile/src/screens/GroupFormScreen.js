import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import FormField from '../components/FormField';
import ChipSelect from '../components/ChipSelect';
import PickerField from '../components/PickerField';
import PrimaryButton from '../components/PrimaryButton';
import { GROUP_TYPE_COLORS } from '../lib/constants';
import pb from '../lib/pocketbase';

const TYPE_OPTIONS = Object.keys(GROUP_TYPE_COLORS);

export default function GroupFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const [form, setForm] = useState({ name: '', description: '', type: 'Cellule', responsible: '' });
  const [responsibleName, setResponsibleName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    navigation.setOptions({ title: id ? 'Modifier le groupe' : 'Nouveau groupe' });
  }, [navigation, id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const record = await pb.collection('groups').getOne(id, { expand: 'responsible' });
        setForm({
          name: record.name || '',
          description: record.description || '',
          type: record.type || 'Cellule',
          responsible: record.responsible || '',
        });
        setResponsibleName(record.expand?.responsible?.name || '');
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger ce groupe.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openMemberPicker = () => {
    navigation.navigate('MemberPicker', {
      onSelect: (member) => {
        setField('responsible')(member.id);
        setResponsibleName(member.name);
      },
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Nom requis', 'Veuillez renseigner le nom du groupe.');
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await pb.collection('groups').update(id, form);
      } else {
        await pb.collection('groups').create(form);
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
          <FormField label="Nom du groupe" value={form.name} onChangeText={setField('name')} placeholder="Cellule Nord" />
          <ChipSelect
            label="Type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={setField('type')}
            colorFor={(option) => GROUP_TYPE_COLORS[option]}
          />
          <PickerField label="Responsable" value={responsibleName} onPress={openMemberPicker} />
          <FormField
            label="Description"
            value={form.description}
            onChangeText={setField('description')}
            placeholder="Description du groupe..."
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
