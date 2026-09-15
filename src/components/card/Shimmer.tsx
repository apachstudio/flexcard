import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet as RNStyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  /** Resting fill painted through the mask (the "text color"). */
  fill: string;
  /** ms between sweeps. */
  pause?: number;
  /** ms one sweep takes. */
  duration?: number;
  /** Extra ms before the very first sweep — lets siblings stagger. */
  delay?: number;
  /** Width of the sweeping highlight band, px. */
  bandWidth?: number;
  /** Sweep band peak color as an "r,g,b" triplet. @default '255,255,255' (a
   * brightening highlight). Pass a dark tone for the inverse — a shadow
   * passing over an already-bright resting fill. */
  bandColorRGB?: string;
  /** Peak alpha of the sweep band (0-1). @default 1 */
  bandOpacity?: number;
  children: React.ReactNode;
};

/**
 * Masked gradient sweep (à la transitions.dev "shimmer-text"): the children
 * are the mask, painted `fill` at rest, with a soft white band sweeping
 * across on a loop.
 */
export function Shimmer({
  fill,
  pause = 1100,
  duration = 1300,
  delay = 0,
  bandWidth = 90,
  bandColorRGB = '255,255,255',
  bandOpacity = 1,
  children,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = 0;
    sweep.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withDelay(pause, withTiming(1, { duration, easing: Easing.inOut(Easing.ease) })),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [sweep, pause, duration, delay]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -bandWidth + sweep.value * (size.width + bandWidth * 2) }],
  }));

  return (
    <MaskedView maskElement={<View>{children}</View>}>
      {/* Invisible twin gives the masked area its intrinsic size. */}
      <View style={styles.ghost} pointerEvents="none" onLayout={onLayout}>
        {children}
      </View>
      <View style={[RNStyleSheet.absoluteFill, { backgroundColor: fill }]} />
      {size.width > 0 && (
        <Animated.View style={[styles.band, { height: size.height }, bandStyle]}>
          <Canvas style={{ width: bandWidth, height: size.height }}>
            <Rect x={0} y={0} width={bandWidth} height={size.height}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(bandWidth, 0)}
                colors={[
                  `rgba(${bandColorRGB},0)`,
                  `rgba(${bandColorRGB},${bandOpacity})`,
                  `rgba(${bandColorRGB},0)`,
                ]}
              />
            </Rect>
          </Canvas>
        </Animated.View>
      )}
    </MaskedView>
  );
}

const styles = RNStyleSheet.create({
  ghost: {
    opacity: 0,
  },
  band: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
