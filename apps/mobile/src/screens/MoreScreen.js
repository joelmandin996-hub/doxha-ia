import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import GroupedSection from '../components/GroupedSection';
import Row from '../components/Row';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

const ITEMS = [
  { key: 'Events', label: 'Événements', icon: 'calendar-outline', color: colors.module.events },
  { key: 'Donations', label: 'Dons', icon: 'heart-outline', color: colors.module.donations },
  { key: 'Settings', label: 'Paramètres', icon: 'settings-outline', color: colors.secondaryLabel },
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
    <Screen edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <Avatar name={currentUser?.name || currentUser?.email} size={52} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {currentUser?.name || 'Utilisateur'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {currentUser?.email}
            </Text>
          </View>
        </View>

        <GroupedSection>
          {ITEMS.map((item) => (
            <Row
              key={item.key}
              icon={item.icon}
              iconColor={item.color}
              label={item.label}
              onPress={() => navigation.navigate(item.key)}
            />
          ))}
        </GroupedSection>

        <GroupedSection>
          <Row label="Déconnexion" danger onPress={handleLogout} />
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...continuousCorner,
    padding: 16,
    marginBottom: 24,
    ...shadow.card,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.label,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
});
