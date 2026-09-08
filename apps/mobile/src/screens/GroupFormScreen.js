import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import GroupedSection from '../components/GroupedSection';
import FormRow from '../components/FormRow';
import Row from '../components/Row';
import ChipSelect from '../components/ChipSelect';
import HeaderButton from '../components/HeaderButton';
import { colors } from '../theme/colors';
import { GROUP_TYPE_COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { autoInset } from '../lib/scrollProps';

const TYPE_OPTIONS = Object.keys(GROUP_TYPE_COLORS);

export default function GroupFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const [form, setForm] = useState({ name: '', description: '', type: 'Cellule', responsible: '' });
  const [responsibleName, setResponsibleName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Nom requis', 'Veuillez renseigner le nom du groupe.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, responsible: form.responsible || null };
      const { error } = id
        ? await supabase.from('groups').update(payload).eq('id', id)
        : await supabase.from('groups').insert(payload);
      if (error) throw error;
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erreur', "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: id ? 'Modifier' : 'Nouveau groupe',
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
        const { data: record, error } = await supabase
          .from('groups')
          .select('*, responsible(id, name)')
          .eq('id', id)
          .single();
        if (error) throw error;
        setForm({
          name: record.name || '',
          description: record.description || '',
          type: record.type || 'Cellule',
          responsible: record.responsible?.id || '',
        });
        setResponsibleName(record.responsible?.name || '');
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger ce groupe.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const openMemberPicker = () => {
    navigation.navigate('MemberPicker', {
      onSelect: (member) => {
        setField('responsible')(member.id);
        setResponsibleName(member.name);
      },
    });
  };

  if (loading) return <Screen edges={['bottom', 'left', 'right']} />;

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" {...autoInset}>
          <GroupedSection>
            <FormRow label="Nom" value={form.name} onChangeText={setField('name')} placeholder="Cellule Nord" />
            <Row label="Responsable" value={responsibleName} placeholder="Aucun" onPress={openMemberPicker} />
          </GroupedSection>

          <GroupedSection title="Type">
            <ChipSelect
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={setField('type')}
              colorFor={(option) => GROUP_TYPE_COLORS[option]}
              inset
            />
          </GroupedSection>

          <GroupedSection title="Description">
            <FormRow value={form.description} onChangeText={setField('description')} placeholder="Description du groupe..." multiline />
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
