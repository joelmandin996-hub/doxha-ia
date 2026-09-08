import React, { forwardRef } from 'react';
import { Pressable } from 'react-native';

// Revolut-style tactile feedback: the row/button scales down slightly under
// the finger instead of just fading, then springs back on release. Plain
// core RN Pressable + its `pressed` state — no Animated wiring needed.
const PressableScale = forwardRef(({ style, children, scaleTo = 0.97, ...rest }, ref) => {
  return (
    <Pressable
      ref={ref}
      style={({ pressed }) => [style, pressed && { transform: [{ scale: scaleTo }] }]}
      {...rest}
    >
      {children}
    </Pressable>
  );
});

export default PressableScale;
