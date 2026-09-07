import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import GroupedSection from '../components/GroupedSection';
import FormRow from '../components/FormRow';
import ChipSelect from '../components/ChipSelect';
import HeaderButton from '../components/HeaderButton';
import { colors } from '../theme/colors';
import { MEMBER_STATUS_COLORS } from '../lib/constants';
import pb from '../lib/pocketbase';

const STATUS_OPTIONS = Object.keys(MEMBER_STATUS_COLORS);

export default function MemberFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', status: 'Nouveau', notes: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: id ? 'Modifier' : 'Nouveau membre',
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

  if (loading) return <Screen edges={['bottom', 'left', 'right']} />;

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <GroupedSection>
            <FormRow label="Nom" value={form.name} onChangeText={setField('name')} placeholder="Jean Dupont" />
            <FormRow
              label="Email"
              value={form.email}
              onChangeText={setField('email')}
              placeholder="jean@eglise.org"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <FormRow
              label="Téléphone"
              value={form.phone}
              onChangeText={setField('phone')}
              placeholder="+33 6 12 34 56 78"
              keyboardType="phone-pad"
            />
            <FormRow label="Adresse" value={form.address} onChangeText={setField('address')} placeholder="Adresse" />
          </GroupedSection>

          <GroupedSection title="Statut">
            <ChipSelect
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={setField('status')}
              colorFor={(option) => MEMBER_STATUS_COLORS[option]}
              inset
            />
          </GroupedSection>

          <GroupedSection title="Notes">
            <FormRow value={form.notes} onChangeText={setField('notes')} placeholder="Notes internes..." multiline />
          </GroupedSection>
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
    paddingBottom: 40,
  },
});
