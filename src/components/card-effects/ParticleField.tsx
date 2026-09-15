import { useEffect, useMemo } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  /** Card size — particles rise across this whole area. */
  width: number;
  height: number;
  color: string;
  particleCount?: number;
  maximumDiameter?: number;
  /** Base opacity — each particle varies around it. */
  restOpacity?: number;
};

type ParticleConfig = {
  key: number;
  x: number;
  diameter: number;
  opacity: number;
  /** Full bottom-to-top travel time, ms. */
  duration: number;
  /** Where along the travel this particle starts, so the field is populated immediately. */
  startProgress: number;
  /** Horizontal sway amplitude (px) and phase. */
  drift: number;
  phase: number;
};

function makeParticles(
  width: number,
  count: number,
  maximumDiameter: number,
  restOpacityBase: number,
): ParticleConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    x: Math.random() * width,
    diameter: 1.2 + Math.random() * (maximumDiameter - 1.2),
    opacity: Math.min(1, restOpacityBase * (0.6 + Math.random() * 0.8)),
    duration: 7000 + Math.random() * 9000,
    startProgress: Math.random(),
    drift: 4 + Math.random() * 10,
    phase: Math.random() * Math.PI * 2,
  }));
}

function RisingParticle({
  config,
  color,
  height,
}: {
  config: ParticleConfig;
  color: string;
  height: number;
}) {
  // 0 = resting just below the bottom edge, 1 = drifted past the top.
  const progress = useSharedValue(config.startProgress);

  useEffect(() => {
    progress.value = config.startProgress;
    progress.value = withSequence(
      // Finish the leg this particle spawned mid-way through…
      withTiming(1, {
        duration: config.duration * (1 - config.startProgress),
        easing: Easing.linear,
      }),
      // …then loop full bottom-to-top passes forever.
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: config.duration, easing: Easing.linear }),
        ),
        -1,
        false,
      ),
    );
  }, [progress, config.startProgress, config.duration]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // Fade in near the bottom, fade out near the top.
    const fadeIn = Math.min(1, p / 0.12);
    const fadeOut = Math.min(1, (1 - p) / 0.18);
    const sway = Math.sin(p * Math.PI * 2 + config.phase) * config.drift;
    return {
      opacity: config.opacity * fadeIn * fadeOut,
      transform: [
        { translateY: height + 10 - p * (height + 30) },
        { translateX: sway },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: config.x,
          top: 0,
          width: config.diameter,
          height: config.diameter,
          borderRadius: config.diameter / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/** Fine dust drifting steadily up the card's face, forever. */
export function ParticleField({
  width,
  height,
  color,
  particleCount = 16,
  maximumDiameter = 2.84,
  restOpacity = 0.55,
}: Props) {
  const particles = useMemo(
    () => makeParticles(width, particleCount, maximumDiameter, restOpacity),
    [width, particleCount, maximumDiameter, restOpacity],
  );

  if (width === 0 || height === 0) return null;

  return (
    <>
      {particles.map((p) => (
        <RisingParticle key={p.key} config={p} color={color} height={height} />
      ))}
    </>
  );
}
