import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { colors, radius } from '../theme/colors';
import { POCKETBASE_URL } from '../lib/pocketbase';
import { useAuth } from '../contexts/AuthContext';

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { currentUser } = useAuth();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Profil</Text>
        <View style={styles.card}>
          <Row label="Nom" value={currentUser?.name || '—'} />
          <Row label="Email" value={currentUser?.email || '—'} />
        </View>

        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.card}>
          <Row label="Serveur" value={POCKETBASE_URL} />
          <Row label="Langue" value="Français" />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    flexShrink: 1,
    textAlign: 'right',
  },
});
