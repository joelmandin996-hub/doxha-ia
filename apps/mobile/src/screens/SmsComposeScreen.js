import React, { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import GroupedSection from '../components/GroupedSection';
import Row from '../components/Row';
import HeaderButton from '../components/HeaderButton';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';
import { autoInset } from '../lib/scrollProps';

// SMS sending goes through apps/api, which still authenticates with
// PocketBase tokens — the mobile app no longer has one now that it runs on
// Supabase Auth. On hold until apps/api is migrated too, rather than left
// silently broken.
export default function SmsComposeScreen({ route, navigation }) {
  const { name, phone } = route.params || {};

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Envoyer un SMS',
      headerLeft: () => <HeaderButton label="Fermer" onPress={() => navigation.goBack()} />,
    });
  }, [navigation]);

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} {...autoInset}>
        <GroupedSection>
          <Row icon="person-outline" iconColor={colors.module.comm} label="Destinataire" value={name} />
          <Row icon="call-outline" iconColor={colors.module.comm} label="Numéro" value={phone} />
        </GroupedSection>

        <EmptyState
          title="Fonctionnalité temporairement indisponible"
          subtitle="L'envoi de SMS est en pause pendant la transition vers le nouveau backend. Il redeviendra disponible une fois que le service d'envoi (apps/api) sera lui aussi connecté."
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
});
