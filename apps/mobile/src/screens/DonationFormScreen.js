import React, { useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import GroupedSection from '../components/GroupedSection';
import FormRow from '../components/FormRow';
import Row from '../components/Row';
import ChipSelect from '../components/ChipSelect';
import DateField from '../components/DateField';
import HeaderButton from '../components/HeaderButton';
import { colors } from '../theme/colors';
import pb from '../lib/pocketbase';
import { autoInset } from '../lib/scrollProps';

const DON_TYPE_OPTIONS = ['unique', 'recurrent'];
const DON_TYPE_LABELS = { unique: 'Don unique', recurrent: 'Don récurrent' };
const STATUS_OPTIONS = ['completed', 'pending'];
const STATUS_LABELS = { completed: 'Complété', pending: 'En attente' };
const STATUS_COLORS = { completed: colors.success, pending: colors.warning };

export default function DonationFormScreen({ navigation }) {
  const [member, setMember] = useState(null);
  const [amount, setAmount] = useState('');
  const [dateDon, setDateDon] = useState(new Date().toISOString());
  const [typeDon, setTypeDon] = useState('unique');
  const [statut, setStatut] = useState('completed');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const openMemberPicker = () => {
    navigation.navigate('MemberPicker', { onSelect: setMember });
  };

  const handleSave = async () => {
    if (!member) {
      Alert.alert('Membre requis', 'Veuillez sélectionner le donateur.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Montant requis', 'Veuillez renseigner un montant valide.');
      return;
    }
    setSaving(true);
    try {
      // The `donations` collection carries both a legacy English field set
      // (member_id/donor_name/amount/donation_type/donation_date, all
      // required) and the newer French one actually shown in the UI
      // (membre_id/date_don/type_don/statut) — both must be filled to pass
      // PocketBase's required-field validation.
      await pb.collection('donations').create({
        member_id: member.id,
        donor_name: member.name,
        amount: Number(amount),
        donation_type: 'offering',
        donation_date: dateDon,
        notes: description,
        membre_id: member.id,
        date_don: dateDon,
        type_don: typeDon,
        statut,
        description,
        created_by: pb.authStore.record.id,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erreur', "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Nouveau don',
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
  }, [navigation, saving, member, amount, dateDon, typeDon, statut, description]);

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" {...autoInset}>
          <GroupedSection>
            <Row label="Donateur" value={member?.name} placeholder="Choisir" onPress={openMemberPicker} />
            <FormRow label="Montant" value={amount} onChangeText={setAmount} placeholder="50 €" keyboardType="decimal-pad" />
            <DateField label="Date" value={dateDon} onChange={setDateDon} />
          </GroupedSection>

          <GroupedSection title="Type de don">
            <ChipSelect options={DON_TYPE_OPTIONS} value={typeDon} onChange={setTypeDon} labelFor={(option) => DON_TYPE_LABELS[option]} inset />
          </GroupedSection>

          <GroupedSection title="Statut">
            <ChipSelect
              options={STATUS_OPTIONS}
              value={statut}
              onChange={setStatut}
              colorFor={(option) => STATUS_COLORS[option]}
              labelFor={(option) => STATUS_LABELS[option]}
              inset
            />
          </GroupedSection>

          <GroupedSection title="Description">
            <FormRow value={description} onChangeText={setDescription} placeholder="Dîme, offrande spéciale..." multiline />
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
