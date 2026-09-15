import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet as RNStyleSheet, View } from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const BAND_W = 130;
const SWEEP_MS = 1500;
const FLIP_SWEEP_MS = 900;
const PAUSE_MS = 2600;
const EASE = Easing.inOut(Easing.ease);

/**
 * A soft diagonal light pass sweeping across the whole card face every few
 * seconds — the "brand new shiny card" glint. Sits above the card content
 * (like light on glass), never intercepts touches, and the face's own
 * rounded-corner clip keeps it inside the card.
 */
export function CardSheen({ trigger }: { trigger?: SharedValue<number> }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withSequence(
        withDelay(PAUSE_MS, withTiming(1, { duration: SWEEP_MS, easing: EASE })),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [sweep]);

  // A flip fires an immediate (faster) sweep, then the ambient loop resumes.
  useAnimatedReaction(
    () => trigger?.value,
    (current, previous) => {
      if (trigger == null || previous === null || current === previous) return;
      sweep.value = 0;
      sweep.value = withSequence(
        withTiming(1, { duration: FLIP_SWEEP_MS, easing: EASE }),
        withTiming(0, { duration: 0 }),
        withRepeat(
          withSequence(
            withDelay(PAUSE_MS, withTiming(1, { duration: SWEEP_MS, easing: EASE })),
            withTiming(0, { duration: 0 }),
          ),
          -1,
          false,
        ),
      );
    },
    [trigger],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const bandStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -(BAND_W + 80) + sweep.value * (size.width + (BAND_W + 80) * 2) },
      { rotate: '18deg' },
    ],
  }));

  const bandHeight = size.height * 1.7;

  return (
    <View style={RNStyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {size.width > 0 && (
        <Animated.View
          style={[
            { position: 'absolute', left: 0, top: -size.height * 0.35, width: BAND_W, height: bandHeight },
            bandStyle,
          ]}
        >
          <Canvas style={{ width: BAND_W, height: bandHeight }}>
            <Rect x={0} y={0} width={BAND_W} height={bandHeight}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(BAND_W, 0)}
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.13)', 'rgba(255,255,255,0)']}
              />
            </Rect>
          </Canvas>
        </Animated.View>
      )}
    </View>
  );
}
