import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

const FILL_EASING = Easing.bezier(0.16, 1, 0.3, 1);

type Props = {
  paid: boolean;
  /** Ticks (the containing ScrollView's scroll offset) drive re-checking visibility. */
  scrollTick: SharedValue<number>;
};

/**
 * One segment of a bill's payment progress bar. Paid bars fill from 0 to
 * 100% every time they scroll into view (not just once on mount) — reset to
 * 0 when they scroll back out, so the fill replays on re-entry. Unpaid bars
 * are a static gray track.
 */
export function ProgressBar({ paid, scrollTick }: Props) {
  const barRef = useAnimatedRef<Animated.View>();
  const fill = useSharedValue(0);
  const wasVisible = useSharedValue(false);
  const { height: screenHeight } = useWindowDimensions();
  const screenHeightShared = useSharedValue(screenHeight);
  useEffect(() => {
    screenHeightShared.value = screenHeight;
  }, [screenHeight, screenHeightShared]);
  // A bar already on-screen at mount needs its own trigger — `scrollTick`
  // only changes on a real scroll event, and `measure` can still return
  // null on the very first pass before layout has committed, so without
  // this an already-visible bar would sit at 0% until the user scrolls.
  // Bumped from the bar's own `onLayout`, which fires once layout commits.
  const layoutTick = useSharedValue(0);

  useAnimatedReaction(
    () => scrollTick.value + layoutTick.value,
    () => {
      if (!paid) return;
      const layout = measure(barRef);
      if (!layout) return;
      const visible = layout.pageY < screenHeightShared.value && layout.pageY + layout.height > 0;
      if (visible && !wasVisible.value) {
        fill.value = 0;
        fill.value = withTiming(1, { duration: 1400, easing: FILL_EASING });
      } else if (!visible) {
        fill.value = 0;
      }
      wasVisible.value = visible;
    },
    [paid],
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <Animated.View ref={barRef} style={styles.track} onLayout={() => { layoutTick.value += 1; }}>
      {paid && <Animated.View style={[styles.fill, fillStyle]} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    flex: 1,
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.actionProgressInactive,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.textSuccess,
  },
}));
