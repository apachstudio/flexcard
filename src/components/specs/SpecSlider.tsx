import { useState } from 'react';
import { type LayoutChangeEvent, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

const THUMB_SIZE = 18;

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Snap increment; 0 (default) means continuous. */
  step?: number;
  /** Fraction digits shown in the value readout. */
  decimals?: number;
  onChange: (value: number) => void;
};

/**
 * A dependency-free slider for the specs toolbar — a Pan (horizontal-only, so
 * it coexists with the panel's vertical scroll) plus a Tap to jump straight
 * to a position on the track.
 */
export function SpecSlider({ label, value, min, max, step = 0, decimals = 0, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const setFromX = (x: number) => {
    if (trackWidth <= 0) return;
    const fraction = Math.min(1, Math.max(0, x / trackWidth));
    let next = min + fraction * (max - min);
    if (step > 0) next = Math.round(next / step) * step;
    onChange(Math.min(max, Math.max(min, next)));
  };

  // No onBegin update here — onBegin fires on touch-down even when the pan
  // later fails in favor of the panel's vertical scroll, which would make
  // scrolling past a slider silently change its value.
  const pan = Gesture.Pan()
    .activeOffsetX([-4, 4])
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      runOnJS(setFromX)(e.x);
    });
  // onEnd fires for failed gestures too (e.g. a vertical panel scroll that
  // passed through this track) — only commit the tap when it succeeded.
  const tap = Gesture.Tap().onEnd((e, success) => {
    if (success) runOnJS(setFromX)(e.x);
  });
  const gesture = Gesture.Exclusive(pan, tap);

  const fraction = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  const thumbLeft = fraction * Math.max(0, trackWidth - THUMB_SIZE);

  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value.toFixed(decimals)}</Text>
      </View>
      <GestureDetector gesture={gesture}>
        <View style={styles.trackHitbox} onLayout={onTrackLayout}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
          </View>
          <View style={[styles.thumb, { left: thumbLeft }]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    ...theme.typography.bodyMd,
    color: theme.colors.textDefault,
  },
  value: {
    ...theme.typography.bodyMd,
    fontVariant: ['tabular-nums'],
    color: theme.colors.textAction,
  },
  trackHitbox: {
    height: 28,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.purple['04'],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.actionPrimaryDefault,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: theme.colors.actionPrimaryDefault,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#150B25',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
}));
