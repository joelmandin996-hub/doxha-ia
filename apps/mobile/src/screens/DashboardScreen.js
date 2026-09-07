import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';
import { formatDate } from '../lib/format';
import { SUIVI_STATUS_COLORS } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import pb from '../lib/pocketbase';

export default function DashboardScreen({ navigation }) {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ members: 0, groups: 0, suivis: 0 });
  const [recentSuivis, setRecentSuivis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [members, groups, suivis, recent] = await Promise.all([
        pb.collection('members').getList(1, 1, { fields: 'id' }),
        pb.collection('groups').getList(1, 1, { fields: 'id' }),
        pb.collection('suivis').getList(1, 1, { fields: 'id' }),
        pb.collection('suivis').getList(1, 5, { sort: '-created', expand: 'membre_id' }),
      ]);
      setStats({ members: members.totalItems, groups: groups.totalItems, suivis: suivis.totalItems });
      setRecentSuivis(recent.items);
    } catch (err) {
      // Dashboard is a best-effort overview; leave stale/zero state on error.
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        <Text style={styles.greeting}>Bonjour{currentUser?.name ? `, ${currentUser.name}` : ''} 👋</Text>
        <Text style={styles.title}>Tableau de bord</Text>

        <View style={styles.statsRow}>
          <StatCard
            label="Membres"
            value={loading ? '—' : stats.members}
            color={colors.module.members}
            icon={<Ionicons name="people" size={18} color={colors.module.members} />}
          />
          <StatCard
            label="Groupes"
            value={loading ? '—' : stats.groups}
            color={colors.module.groups}
            icon={<Ionicons name="people-circle" size={18} color={colors.module.groups} />}
          />
          <StatCard
            label="Suivis"
            value={loading ? '—' : stats.suivis}
            color={colors.module.followups}
            icon={<Ionicons name="git-branch" size={18} color={colors.module.followups} />}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suivis récents</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Suivis')}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {recentSuivis.length === 0 && !loading ? (
          <EmptyState title="Aucun suivi récent" subtitle="Les nouveaux suivis apparaîtront ici." />
        ) : (
          recentSuivis.map((item) => (
            <View key={item.id} style={styles.suiviCard}>
              <View style={styles.suiviHeader}>
                <Text style={styles.suiviName} numberOfLines={1}>
                  {item.expand?.membre_id?.name || item.description || 'Sans nom'}
                </Text>
                <Badge label={item.statut} color={SUIVI_STATUS_COLORS[item.statut] || colors.primary} />
              </View>
              <Text style={styles.suiviMeta} numberOfLines={1}>
                {item.type || 'Suivi'} · {formatDate(item.created)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 15,
    color: colors.secondaryLabel,
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.label,
    letterSpacing: 0.2,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.label,
  },
  sectionLink: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  suiviCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...continuousCorner,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  suiviHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  suiviName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.label,
  },
  suiviMeta: {
    fontSize: 12,
    color: colors.secondaryLabel,
  },
});
