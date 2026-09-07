import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import FormField from '../components/FormField';
import ChipSelect from '../components/ChipSelect';
import PrimaryButton from '../components/PrimaryButton';
import { MEMBER_STATUS_COLORS } from '../lib/constants';
import pb from '../lib/pocketbase';

const STATUS_OPTIONS = Object.keys(MEMBER_STATUS_COLORS);

export default function MemberFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', status: 'Nouveau', notes: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    navigation.setOptions({ title: id ? 'Modifier le membre' : 'Nouveau membre' });
  }, [navigation, id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const record = await pb.collection('members').getOne(id);
        setForm({
          name: record.name || '',
          email: record.email || '',
          phone: record.phone || '',
          address: record.address || '',
          status: record.status || 'Nouveau',
          notes: record.notes || '',
        });
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger ce membre.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Nom requis', 'Veuillez renseigner le nom du membre.');
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await pb.collection('members').update(id, form);
      } else {
        await pb.collection('members').create(form);
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <FormField label="Nom complet" value={form.name} onChangeText={setField('name')} placeholder="Jean Dupont" />
          <FormField
            label="Email"
            value={form.email}
            onChangeText={setField('email')}
            placeholder="jean@eglise.org"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <FormField
            label="Téléphone"
            value={form.phone}
            onChangeText={setField('phone')}
            placeholder="+33 6 12 34 56 78"
            keyboardType="phone-pad"
          />
          <FormField label="Adresse" value={form.address} onChangeText={setField('address')} placeholder="Adresse" />
          <ChipSelect
            label="Statut"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={setField('status')}
            colorFor={(option) => MEMBER_STATUS_COLORS[option]}
          />
          <FormField
            label="Notes"
            value={form.notes}
            onChangeText={setField('notes')}
            placeholder="Notes internes..."
            multiline
          />
          <PrimaryButton label="Enregistrer" onPress={handleSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
});
