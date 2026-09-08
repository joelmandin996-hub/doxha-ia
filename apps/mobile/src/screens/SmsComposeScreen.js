import React, { useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import Screen from '../components/Screen';
import GroupedSection from '../components/GroupedSection';
import Row from '../components/Row';
import FormRow from '../components/FormRow';
import HeaderButton from '../components/HeaderButton';
import { colors } from '../theme/colors';
import { apiFetch } from '../lib/apiClient';
import { autoInset } from '../lib/scrollProps';

function normalizePhone(raw) {
  return (raw || '').replace(/[^\d+]/g, '');
}

export default function SmsComposeScreen({ route, navigation }) {
  const { name, phone } = route.params || {};
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const phoneNumber = normalizePhone(phone);
  const phoneValid = /^\+[0-9]+$/.test(phoneNumber);

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Message vide', 'Écrivez un message avant d\'envoyer.');
      return;
    }
    if (!phoneValid) {
      Alert.alert(
        'Numéro invalide',
        "Le numéro de ce membre doit inclure l'indicatif pays (ex. +33...). Modifiez sa fiche puis réessayez."
      );
      return;
    }
    setSending(true);
    try {
      await apiFetch('/sms/send', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, message: message.trim() }),
      });
      Alert.alert('SMS envoyé', `Votre message a été envoyé à ${name}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erreur', err.message || "L'envoi a échoué.");
    } finally {
      setSending(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Envoyer un SMS',
      headerLeft: () => <HeaderButton label="Annuler" onPress={() => navigation.goBack()} />,
      headerRight: () => (
        <HeaderButton
          label={sending ? 'Envoi...' : 'Envoyer'}
          bold
          color={sending ? colors.tertiaryLabel : colors.primary}
          onPress={sending ? undefined : handleSend}
        />
      ),
    });
  }, [navigation, sending, message]);

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" {...autoInset}>
          <GroupedSection>
            <Row icon="person-outline" iconColor={colors.module.comm} label="Destinataire" value={name} />
            <Row icon="call-outline" iconColor={colors.module.comm} label="Numéro" value={phone} />
          </GroupedSection>

          {!phoneValid ? (
            <Text style={styles.warning}>
              Ce numéro n'a pas d'indicatif pays (+33, +243...) — l'envoi échouera tant qu'il n'est pas corrigé sur
              la fiche du membre.
            </Text>
          ) : null}

          <GroupedSection title="Message">
            <FormRow value={message} onChangeText={setMessage} placeholder="Écrivez votre message..." multiline />
          </GroupedSection>
          <Text style={styles.counter}>{message.length} caractères</Text>
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
  warning: {
    fontSize: 13,
    color: colors.destructive,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  counter: {
    fontSize: 12,
    color: colors.tertiaryLabel,
    textAlign: 'right',
    marginTop: 6,
    marginHorizontal: 4,
  },
});
