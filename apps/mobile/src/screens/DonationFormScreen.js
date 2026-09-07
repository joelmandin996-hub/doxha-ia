import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import FormField from '../components/FormField';
import ChipSelect from '../components/ChipSelect';
import PickerField from '../components/PickerField';
import DateField from '../components/DateField';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import pb from '../lib/pocketbase';

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
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erreur', "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <PickerField label="Donateur" value={member?.name} onPress={openMemberPicker} />
          <FormField
            label="Montant (€)"
            value={amount}
            onChangeText={setAmount}
            placeholder="50"
            keyboardType="decimal-pad"
          />
          <DateField label="Date du don" value={dateDon} onChange={setDateDon} />
          <ChipSelect
            label="Type de don"
            options={DON_TYPE_OPTIONS}
            value={typeDon}
            onChange={setTypeDon}
            labelFor={(option) => DON_TYPE_LABELS[option]}
          />
          <ChipSelect
            label="Statut"
            options={STATUS_OPTIONS}
            value={statut}
            onChange={setStatut}
            colorFor={(option) => STATUS_COLORS[option]}
            labelFor={(option) => STATUS_LABELS[option]}
          />
          <FormField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Dîme, offrande spéciale..."
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
