import { useMemo } from 'react';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  /** Card size — particles are scattered at rest across this whole area. */
  width: number;
  height: number;
  color: string;
  /** Ported from `particleCount` (80) — cut down for RN's lack of a GPU particle system. */
  particleCount?: number;
  /** Ported from `maximumDiameter` (3.55). */
  maximumDiameter?: number;
  /**
   * Bump this (e.g. `value += 1`) whenever the card flips — each change
   * kicks the settled dust up into a random scatter, then lets gravity pull
   * it back down to rest, like a real card shaking dust off itself.
   */
  burstTrigger?: SharedValue<number>;
};

type ParticleConfig = {
  key: number;
  restX: number;
  restY: number;
  diameter: number;
  restOpacity: number;
};

function makeParticles(width: number, height: number, count: number, maximumDiameter: number): ParticleConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    restX: Math.random() * width,
    restY: Math.random() * height,
    diameter: 1.2 + Math.random() * (maximumDiameter - 1.2),
    // Settled dust isn't uniformly visible — vary it so it reads as texture, not a grid.
    restOpacity: 0.25 + Math.random() * 0.45,
  }));
}

function Particle({
  config,
  color,
  burstTrigger,
}: {
  config: ParticleConfig;
  color: string;
  burstTrigger?: SharedValue<number>;
}) {
  // 0 = at rest on the card. A flip kicks this up toward 1 (airborne, blown
  // outward) then gravity springs it back down to 0 — "levanta a poeira".
  const kick = useSharedValue(0);
  const burstAngle = useSharedValue(0);
  const burstPower = useSharedValue(0);

  useAnimatedReaction(
    () => burstTrigger?.value,
    (current, previous) => {
      if (previous === null || current === previous) return;
      burstAngle.value = Math.random() * Math.PI * 2;
      burstPower.value = 8 + Math.random() * 20;
      kick.value = 0;
      kick.value = withSequence(
        withTiming(1, { duration: 110 + Math.random() * 60, easing: Easing.out(Easing.cubic) }),
        withSpring(0, { damping: 6, stiffness: 130, mass: 0.5 }),
      );
    },
    [burstTrigger],
  );

  const style = useAnimatedStyle(() => {
    const k = kick.value;
    const airborne = Math.max(0, k);
    const burstX = Math.cos(burstAngle.value) * burstPower.value * k;
    // Tossed up while airborne; the spring settle carries it back to 0 (and
    // slightly past, for a tiny natural bounce as it lands).
    const burstY = -Math.abs(Math.sin(burstAngle.value)) * burstPower.value * 0.8 * k;
    return {
      opacity: Math.min(1, config.restOpacity + airborne * 0.5),
      transform: [
        { translateX: burstX },
        { translateY: burstY },
        { scale: 1 + airborne * 0.5 },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: config.restX,
          top: config.restY,
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

/** Dust settled across the card's surface — sits still until a flip shakes it up, then gravity resettles it. */
export function ParticleField({
  width,
  height,
  color,
  particleCount = 16,
  maximumDiameter = 2.84,
  burstTrigger,
}: Props) {
  const particles = useMemo(
    () => makeParticles(width, height, particleCount, maximumDiameter),
    [width, height, particleCount, maximumDiameter],
  );

  if (width === 0 || height === 0) return null;

  return (
    <>
      {particles.map((p) => (
        <Particle key={p.key} config={p} color={color} burstTrigger={burstTrigger} />
      ))}
    </>
  );
}
