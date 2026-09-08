import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import { colors, continuousCorner, radius } from '../theme/colors';
import { formatDate } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import { defaultTabBarStyle } from '../navigation/MainTabs';
import { supabase } from '../lib/supabase';

function Bubble({ message, mine }) {
  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.text}</Text>
      </View>
      <Text style={[styles.time, mine && styles.timeMine]}>{formatDate(message.created, 'HH:mm')}</Text>
    </View>
  );
}

export default function ChatThreadScreen({ route, navigation }) {
  const { conversationId, otherUser } = route.params;
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: otherUser?.name || otherUser?.email || 'Conversation' });
  }, [navigation, otherUser]);

  // This screen lives inside the "More" tab's stack, which keeps the bottom
  // tab bar mounted by default — that would waste vertical space and put
  // the input bar right on top of it. Hide it while the thread is open.
  useLayoutEffect(() => {
    const tabNavigation = navigation.getParent();
    tabNavigation?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => tabNavigation?.setOptions({ tabBarStyle: defaultTabBarStyle });
  }, [navigation]);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation', conversationId)
        .order('created');
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger la conversation.');
    }
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const channel = supabase
      .channel(`chat_messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation=eq.${conversationId}` },
        (payload) => {
          Haptics.selectionAsync();
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSend = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setText('');
    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({ conversation: conversationId, sender: currentUser.id, text: value });
      if (error) throw error;
    } catch (err) {
      Alert.alert('Erreur', "L'envoi a échoué.");
      setText(value);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <Bubble message={item} mine={item.sender === currentUser.id} />}
        />
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={colors.tertiaryLabel}
            multiline
          />
          <PressableScale
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            disabled={!text.trim() || sending}
            onPress={handleSend}
          >
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    padding: 16,
    gap: 10,
  },
  bubbleRow: {
    alignItems: 'flex-start',
    maxWidth: '80%',
  },
  bubbleRowMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: radius.lg,
    ...continuousCorner,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleTheirs: {
    backgroundColor: colors.card,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.label,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  time: {
    fontSize: 11,
    color: colors.tertiaryLabel,
    marginTop: 3,
    marginHorizontal: 4,
  },
  timeMine: {
    textAlign: 'right',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.separator,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    backgroundColor: colors.fill,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    color: colors.label,
    maxHeight: 100,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.tertiaryLabel,
  },
});
