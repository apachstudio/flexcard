import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

let listener: ((message: string) => void) | null = null;

/** Show the app's bottom toast — safe to call from anywhere. */
export function showToast(message: string) {
  listener?.(message);
}

const TOAST_DURATION_MS = 2200;

/**
 * iOS-style feedback toast: a dark pill that rises from the bottom, holds,
 * and sinks away. Mount once, above everything (it renders nothing while
 * idle and never intercepts touches).
 */
export function ToastHost() {
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let counter = 0;
    listener = (message) => {
      counter += 1;
      // A fresh id re-mounts the pill so repeated copies replay the entrance.
      setToast({ message, id: counter });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    };
    return () => {
      listener = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!toast) return null;

  return (
    <Animated.View
      key={toast.id}
      pointerEvents="none"
      entering={FadeInDown.duration(320).easing(Easing.out(Easing.cubic))}
      exiting={FadeOutDown.duration(260).easing(Easing.in(Easing.cubic))}
      style={styles.toast}
    >
      <Text style={styles.label}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  toast: {
    position: 'absolute',
    bottom: 108,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.default,
    paddingVertical: theme.spacing.dense,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(14, 6, 34, 0.92)',
    shadowColor: '#0E0622',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  label: {
    ...theme.typography.bodyMd,
    color: '#FFFFFF',
  },
}));
