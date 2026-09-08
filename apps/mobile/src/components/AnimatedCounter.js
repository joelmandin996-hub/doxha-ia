import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text } from 'react-native';

// Revolut-style "counting up" number instead of a value that just pops in.
export default function AnimatedCounter({ value, style, duration = 600 }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = Number(value) || 0;
    prevValue.current = to;
    anim.setValue(0);
    const listener = anim.addListener(({ value: t }) => {
      setDisplay(Math.round(from + (to - from) * t));
    });
    Animated.timing(anim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <Text style={style}>{display}</Text>;
}
