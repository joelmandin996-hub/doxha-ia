import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, continuousCorner, radius } from '../theme/colors';

const ACTION_WIDTH = 84;
const OPEN_X = -ACTION_WIDTH;
const TRIGGER_THRESHOLD = -ACTION_WIDTH * 0.6;

// iOS Mail/Reminders-style swipe-to-delete: drag the row left to reveal a
// red delete button, either release past the threshold to snap it open or
// tap it once revealed. Built on RN's own Animated + PanResponder — no
// gesture-handler/reanimated needed, so there's nothing native-config-risky
// about it.
export default function SwipeableRow({ children, onDelete }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);

  const snapTo = (toValue) => {
    openRef.current = toValue !== 0;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      // Capture (not just "should set") so a horizontal drag wins the
      // gesture before the row's own TouchableOpacity claims it as a tap —
      // otherwise a child touchable can swallow the gesture before this
      // responder ever gets to negotiate for it.
      // If the row is already open, capture the very first touch so a tap
      // on the row content closes it instead of falling through to the
      // row's own onPress (the standard iOS behaviour).
      onStartShouldSetPanResponderCapture: () => openRef.current,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gesture) => {
        const base = openRef.current ? OPEN_X : 0;
        const next = Math.min(0, Math.max(OPEN_X * 1.2, base + gesture.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const wasOpen = openRef.current;
        const isTap = Math.abs(gesture.dx) < 8 && Math.abs(gesture.dy) < 8;
        if (wasOpen && isTap) {
          snapTo(0);
          return;
        }
        const base = wasOpen ? OPEN_X : 0;
        const finalX = base + gesture.dx;
        if (finalX < TRIGGER_THRESHOLD) {
          if (!wasOpen) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          snapTo(OPEN_X);
        } else {
          snapTo(0);
        }
      },
    })
  ).current;

  const handleDelete = () => {
    snapTo(0);
    onDelete();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.actionTrack}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  actionTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTION_WIDTH,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteButton: {
    width: ACTION_WIDTH - 8,
    height: '100%',
    backgroundColor: colors.destructive,
    borderRadius: radius.lg,
    ...continuousCorner,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
