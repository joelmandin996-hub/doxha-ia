import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import GroupedSection from '../components/GroupedSection';
import Row from '../components/Row';
import { POCKETBASE_URL } from '../lib/pocketbase';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen() {
  const { currentUser } = useAuth();

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <GroupedSection title="Profil">
          <Row label="Nom" value={currentUser?.name} placeholder="—" />
          <Row label="Email" value={currentUser?.email} placeholder="—" />
        </GroupedSection>

        <GroupedSection title="À propos">
          <Row label="Serveur" value={POCKETBASE_URL} />
          <Row label="Langue" value="Français" />
        </GroupedSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
});
