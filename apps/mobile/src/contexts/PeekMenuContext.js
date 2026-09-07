import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, continuousCorner, radius, shadow } from '../theme/colors';

const PeekMenuContext = createContext(null);

export function usePeekMenu() {
  return useContext(PeekMenuContext);
}

const MENU_ITEM_HEIGHT = 46;
const MENU_WIDTH = 230;

// The classic iOS "3D Touch" / Haptic Touch interaction: long-press a row
// and it lifts in place (blurred backdrop, scaled-up static preview) with a
// floating action menu anchored to it. Tapping the preview opens the row;
// tapping outside dismisses. Built with Modal + Animated + expo-blur only —
// no native context-menu module, so it still runs in Expo Go.
export function PeekMenuProvider({ children }) {
  const [state, setState] = useState(null);
  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const showPeek = useCallback(
    (rowRef, preview, actions, onOpen) => {
      rowRef?.measureInWindow?.((x, y, width, height) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setState({ layout: { x, y, width, height }, preview, actions, onOpen });
        scale.setValue(0.94);
        opacity.setValue(0);
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
          Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      });
    },
    [scale, opacity]
  );

  const close = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setState(null);
    });
  }, [opacity]);

  const open = useCallback(() => {
    const onOpen = state?.onOpen;
    close();
    onOpen?.();
  }, [state, close]);

  let menuTop = 0;
  if (state) {
    const { height: screenHeight } = Dimensions.get('window');
    const menuHeight = state.actions.length * MENU_ITEM_HEIGHT;
    const spaceBelow = screenHeight - (state.layout.y + state.layout.height);
    const fitsBelow = spaceBelow > menuHeight + 24;
    menuTop = fitsBelow
      ? state.layout.y + state.layout.height + 10
      : Math.max(60, state.layout.y - menuHeight - 10);
  }

  return (
    <PeekMenuContext.Provider value={{ showPeek }}>
      {children}
      <Modal visible={!!state} transparent animationType="none" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
        {state ? (
          <>
            <Animated.View
              style={[
                styles.peek,
                {
                  top: state.layout.y,
                  left: state.layout.x,
                  width: state.layout.width,
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            >
              <Pressable onPress={open}>{state.preview}</Pressable>
            </Animated.View>

            <Animated.View
              style={[
                styles.menu,
                {
                  top: menuTop,
                  left: Math.min(state.layout.x, Dimensions.get('window').width - MENU_WIDTH - 16),
                  opacity,
                },
              ]}
            >
              {state.actions.map((action, index) => (
                <Pressable
                  key={action.label}
                  style={[styles.menuItem, index > 0 && styles.menuItemBorder]}
                  onPress={() => {
                    close();
                    action.onPress();
                  }}
                >
                  <Text style={[styles.menuLabel, action.destructive && styles.menuLabelDestructive]}>
                    {action.label}
                  </Text>
                  <Ionicons
                    name={action.icon}
                    size={18}
                    color={action.destructive ? colors.destructive : colors.label}
                  />
                </Pressable>
              ))}
            </Animated.View>
          </>
        ) : null}
      </Modal>
    </PeekMenuContext.Provider>
  );
}

const styles = StyleSheet.create({
  peek: {
    position: 'absolute',
    borderRadius: radius.lg,
    ...continuousCorner,
    ...shadow.raised,
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    ...continuousCorner,
    overflow: 'hidden',
    ...shadow.raised,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: MENU_ITEM_HEIGHT,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderTopWidth: 0.5,
    borderTopColor: colors.separator,
  },
  menuLabel: {
    fontSize: 16,
    color: colors.label,
    fontWeight: '500',
  },
  menuLabelDestructive: {
    color: colors.destructive,
  },
});
