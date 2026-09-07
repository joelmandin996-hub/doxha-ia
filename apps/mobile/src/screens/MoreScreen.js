import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import { colors, radius } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

const ITEMS = [
  { key: 'Events', label: 'Événements', icon: 'calendar-outline', color: colors.module.events },
  { key: 'Donations', label: 'Dons', icon: 'heart-outline', color: colors.module.donations },
  { key: 'Settings', label: 'Paramètres', icon: 'settings-outline', color: colors.mutedForeground },
];

export default function MoreScreen({ navigation }) {
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Se déconnecter ?', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Plus</Text>

        <View style={styles.profileCard}>
          <Avatar name={currentUser?.name || currentUser?.email} size={48} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {currentUser?.name || 'Utilisateur'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {currentUser?.email}
            </Text>
          </View>
        </View>

        {ITEMS.map((item) => (
          <TouchableOpacity key={item.key} style={styles.row} onPress={() => navigation.navigate(item.key)}>
            <View style={[styles.iconWrap, { backgroundColor: `${item.color}1a` }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={styles.logoutLabel}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 12,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.destructive,
  },
});
