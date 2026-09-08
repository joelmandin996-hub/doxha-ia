import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import FadeInItem from '../components/FadeInItem';
import PressableScale from '../components/PressableScale';
import EmptyState from '../components/EmptyState';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';
import { formatDate } from '../lib/format';
import { autoInset } from '../lib/scrollProps';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ChatListScreen({ navigation }) {
  const { currentUser } = useAuth();
  const [teammates, setTeammates] = useState([]);
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async ({ silent } = {}) => {
      if (!silent) setLoading(true);
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('name');
        if (profilesError) throw profilesError;
        setTeammates((profiles || []).filter((u) => u.id !== currentUser.id));

        const { data: conversations, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`);
        if (convError) throw convError;

        const entries = await Promise.all(
          (conversations || []).map(async (conv) => {
            const otherId = conv.user_a === currentUser.id ? conv.user_b : conv.user_a;
            const { data: last } = await supabase
              .from('chat_messages')
              .select('text, created')
              .eq('conversation', conv.id)
              .order('created', { ascending: false })
              .limit(1)
              .maybeSingle();
            return [otherId, { conversationId: conv.id, text: last?.text, created: last?.created }];
          })
        );
        setPreviews(Object.fromEntries(entries));
      } catch (err) {
        // Chat is a bonus feature — a load failure shouldn't block the rest of the app.
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUser.id]
  );

  useFocusEffect(
    useCallback(() => {
      load({ silent: true });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const sorted = useMemo(() => {
    return [...teammates].sort((a, b) => {
      const pa = previews[a.id]?.created;
      const pbCreated = previews[b.id]?.created;
      if (pa && pbCreated) return pbCreated.localeCompare(pa);
      if (pa && !pbCreated) return -1;
      if (!pa && pbCreated) return 1;
      return (a.name || a.email).localeCompare(b.name || b.email);
    });
  }, [teammates, previews]);

  const openThread = async (user) => {
    const existingId = previews[user.id]?.conversationId;
    if (existingId) {
      navigation.navigate('ChatThread', { conversationId: existingId, otherUser: user });
      return;
    }
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(user_a.eq.${currentUser.id},user_b.eq.${user.id}),and(user_a.eq.${user.id},user_b.eq.${currentUser.id})`
      )
      .maybeSingle();
    if (existing) {
      navigation.navigate('ChatThread', { conversationId: existing.id, otherUser: user });
      return;
    }
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ user_a: currentUser.id, user_b: user.id })
      .select('id')
      .single();
    if (error) return;
    navigation.navigate('ChatThread', { conversationId: conv.id, otherUser: user });
  };

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <FlatList
        {...autoInset}
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          !loading ? <EmptyState title="Aucun collègue" subtitle="Aucun autre compte pour l'instant." /> : null
        }
        renderItem={({ item, index }) => {
          const preview = previews[item.id];
          return (
            <FadeInItem index={index}>
              <PressableScale style={styles.row} onPress={() => openThread(item)}>
                <Avatar name={item.name || item.email} color={colors.module.comm} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name || item.email}
                  </Text>
                  <Text style={styles.rowPreview} numberOfLines={1}>
                    {preview?.text || 'Démarrer la conversation'}
                  </Text>
                </View>
                {preview?.created ? <Text style={styles.rowTime}>{formatDate(preview.created, 'HH:mm')}</Text> : null}
              </PressableScale>
            </FadeInItem>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...continuousCorner,
    padding: 12,
    gap: 12,
    ...shadow.card,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.label,
  },
  rowPreview: {
    fontSize: 13,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
  rowTime: {
    fontSize: 12,
    color: colors.tertiaryLabel,
  },
});
