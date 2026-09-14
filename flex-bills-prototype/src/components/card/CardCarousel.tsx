import { useCallback, useEffect, useState } from 'react';
import { type LayoutChangeEvent, Pressable, View } from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { PaymentMethod } from '../../data/mockBills';
import { ParticleField } from '../card-effects/ParticleField';
import {
  CheckingAccountCardFace,
  CheckingAccountTeaser,
  DebitCardFace,
  DebitCardTeaser,
} from './CardFaces';
import { ShaderCard } from './ShaderCard';
import type { GradientStop } from './shader';

const CARD_GAP = 4;
const SCREEN_MARGIN = 24;
const CARD_RADIUS = 42;
const CARD_ASPECT = 354 / 216;
const DOTS_GAP_FROM_CARD = 12;
const ROTATION_SPEED = 150;
const DRAG_ELASTIC = 0.12;
// How far a touch must move horizontally/vertically before the carousel's
// Pan gesture activates — keeps a plain tap-to-flip from also registering
// as a drag.
const PAN_ACTIVATION_PX = 10;
const PAN_VERTICAL_TOLERANCE_PX = 20;
// Ported from the Figma Make reference's CardCarousel drag thresholds.
const VELOCITY_THRESHOLD = 800;
const SPRING_CONFIG = { damping: 40, stiffness: 420, mass: 0.9 };
// A bouncier, more pronounced spring for the flip — "premium and sexy" per
// feedback, with a visible slight overshoot at the end of each flip.
const FLIP_SPRING_CONFIG = { damping: 12, stiffness: 100, mass: 1 };

// Gradient params ported from the two Figma shader instances (see
// components/card/shader.ts for the port itself).
const DEBIT_GRADIENT: [GradientStop, GradientStop, GradientStop] = [
  { position: 0, color: { r: 0.1725, g: 0.098, b: 0.302, a: 1 } },
  { position: 0.5, color: { r: 0.4157, g: 0.2392, b: 0.7216, a: 1 } },
  { position: 1, color: { r: 0.4157, g: 0.2392, b: 0.7216, a: 1 } },
];
const CHECKING_GRADIENT: [GradientStop, GradientStop, GradientStop] = [
  { position: 0, color: { r: 0.7786, g: 0.6777, b: 0.9013, a: 1 } },
  { position: 0.5, color: { r: 0.4575, g: 0.2458, b: 0.7152, a: 1 } },
  { position: 1, color: { r: 0.6282, g: 0.5161, b: 0.7646, a: 1 } },
];

export type SwipeDirection = 'toRight' | 'toLeft';

type Props = {
  onFocusChange?: (method: PaymentMethod, direction: SwipeDirection) => void;
};

type CardKind = {
  gradient: [GradientStop, GradientStop, GradientStop];
  intensity: number;
  // detail/twist/morphSpeed ported 1:1 from the Figma "Moving gradient"
  // panel; warp is that panel's "Flow" slider.
  detail: number;
  warp: number;
  twist: number;
  morphSpeed: number;
  Teaser: () => React.ReactElement;
  Detail: () => React.ReactElement;
};

const DEBIT_CARD: CardKind = {
  gradient: DEBIT_GRADIENT,
  intensity: 2.81,
  detail: 1,
  warp: 0.76,
  twist: 0,
  morphSpeed: 0.87,
  Teaser: DebitCardTeaser,
  Detail: DebitCardFace,
};
const CHECKING_CARD: CardKind = {
  gradient: CHECKING_GRADIENT,
  intensity: 2.61,
  detail: 1,
  warp: 0.86,
  twist: 0,
  morphSpeed: 0.87,
  Teaser: CheckingAccountTeaser,
  Detail: CheckingAccountCardFace,
};

/**
 * A single carousel card: sinks to 94% scale / 85% opacity when not the
 * active page (ported from the reference), and flips vertically (rotateX)
 * on tap — front is a no-sensitive-details teaser, back is the full detail
 * view. Each tap keeps rotating the same direction (a continuously
 * incrementing target, not a 0/180 toggle) with a bouncy spring.
 *
 * `rotation` and `tap` are owned by the parent carousel (not created here)
 * so the carousel's Pan gesture can call `requireExternalGestureToFail` on
 * each card's Tap — without that relation, Tap and Pan are independent
 * GestureDetectors that both get to run for the same touch, which is what
 * let a plain tap-to-flip also mis-fire a page swipe.
 */
function CarouselCard({
  width,
  active,
  kind,
  rotation,
  tap,
}: {
  width: number;
  active: boolean;
  kind: CardKind;
  rotation: SharedValue<number>;
  tap: GestureType;
}) {
  const scale = useSharedValue(active ? 1 : 0.94);
  const opacity = useSharedValue(active ? 1 : 0.85);

  useEffect(() => {
    scale.value = withSpring(active ? 1 : 0.94, SPRING_CONFIG);
    opacity.value = withSpring(active ? 1 : 0.85, SPRING_CONFIG);
  }, [active, scale, opacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // `backfaceVisibility: 'hidden'` alone isn't reliably respected together
  // with an animated `rotateX` on this RN/Fabric version — without this,
  // the Detail face (real card number, CVC) rendered on top of the Teaser
  // even at rest, defeating the whole point of the flip. Opacity, driven
  // directly off the normalized angle, guarantees exactly one face shows.
  const frontStyle = useAnimatedStyle(() => {
    const angle = ((rotation.value % 360) + 360) % 360;
    return {
      opacity: angle < 90 || angle > 270 ? 1 : 0,
      transform: [{ perspective: 1400 }, { rotateX: `${rotation.value}deg` }],
    };
  });
  const backStyle = useAnimatedStyle(() => {
    const angle = ((rotation.value + 180) % 360 + 360) % 360;
    return {
      opacity: angle < 90 || angle > 270 ? 1 : 0,
      transform: [{ perspective: 1400 }, { rotateX: `${rotation.value + 180}deg` }],
    };
  });

  const { Teaser, Detail } = kind;

  return (
    <Animated.View style={[{ width }, containerStyle]}>
      <GestureDetector gesture={tap}>
        <View style={styles.flipRoot}>
          <Animated.View style={[styles.cardClip, styles.face, frontStyle]}>
            <ShaderCard
              gradient={kind.gradient}
              intensity={kind.intensity}
              rotationSpeed={ROTATION_SPEED}
              detail={kind.detail}
              warp={kind.warp}
              twist={kind.twist}
              morphSpeed={kind.morphSpeed}
              active={active}
            >
              <Teaser />
            </ShaderCard>
          </Animated.View>
          <Animated.View style={[styles.cardClip, styles.face, styles.backFace, backStyle]}>
            <ShaderCard
              gradient={kind.gradient}
              intensity={kind.intensity}
              rotationSpeed={ROTATION_SPEED}
              detail={kind.detail}
              warp={kind.warp}
              twist={kind.twist}
              morphSpeed={kind.morphSpeed}
              active={active}
            >
              <Detail />
            </ShaderCard>
          </Animated.View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

/** A dot that widens into a pill when active — tap to jump to that card. */
function PageDot({ active, onPress }: { active: boolean; onPress: () => void }) {
  const width = useSharedValue(active ? 16 : 6);
  const opacity = useSharedValue(active ? 1 : 0.2);

  useEffect(() => {
    width.value = withSpring(active ? 16 : 6, { damping: 40, stiffness: 500 });
    opacity.value = withSpring(active ? 1 : 0.2, { damping: 40, stiffness: 500 });
  }, [active, width, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.dotHitbox}>
      <Animated.View style={[styles.dot, animatedStyle]} />
    </Pressable>
  );
}

export function CardCarousel({ onFocusChange }: Props) {
  const { theme } = useUnistyles();
  const [containerWidth, setContainerWidth] = useState(0);
  const [page, setPage] = useState<0 | 1>(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const cardWidth = Math.max(0, containerWidth - SCREEN_MARGIN * 2);
  const cardHeight = cardWidth / CARD_ASPECT;
  const pageWidth = cardWidth + CARD_GAP;

  const translateX = useSharedValue(0);
  const dragStartX = useSharedValue(0);

  const rotationDebit = useSharedValue(0);
  const rotationChecking = useSharedValue(0);
  // Bumped on every flip — ParticleField reacts to it with a physics-y burst.
  const particleBurst = useSharedValue(0);

  // Only the focused card should be flippable — otherwise a sliver of the
  // other card exposed by the drag's elastic overscroll is tappable too.
  const makeFlipTap = (rotation: SharedValue<number>, enabled: boolean) =>
    Gesture.Tap()
      .enabled(enabled)
      .onEnd(() => {
        rotation.value = withSpring(rotation.value + 180, FLIP_SPRING_CONFIG);
        particleBurst.value += 1;
      });
  const tapDebit = makeFlipTap(rotationDebit, page === 0);
  const tapChecking = makeFlipTap(rotationChecking, page === 1);

  const commitPage = useCallback(
    (next: 0 | 1, prev: 0 | 1) => {
      if (next === prev) return;
      setPage(next);
      onFocusChange?.(next === 0 ? 'debit' : 'checking', next > prev ? 'toRight' : 'toLeft');
    },
    [onFocusChange],
  );

  const goToPage = useCallback(
    (next: 0 | 1) => {
      translateX.value = withSpring(-next * pageWidth, SPRING_CONFIG);
      commitPage(next, page);
    },
    [translateX, pageWidth, commitPage, page],
  );

  const pan = Gesture.Pan()
    // Requires real horizontal movement before activating, so a plain tap
    // on a card (which flips it) doesn't also get read as a tiny drag.
    .activeOffsetX([-PAN_ACTIVATION_PX, PAN_ACTIVATION_PX])
    .failOffsetY([-PAN_VERTICAL_TOLERANCE_PX, PAN_VERTICAL_TOLERANCE_PX])
    // Independently, this makes Pan explicitly wait for each card's own Tap
    // to fail before activating — the standard multi-target
    // requireExternalGestureToFail pattern (Pan only ever "competes" with
    // whichever card's Tap actually received the same touch; the other
    // card's Tap is simply irrelevant to that touch, not a blocker).
    .requireExternalGestureToFail(tapDebit, tapChecking)
    .onBegin(() => {
      dragStartX.value = translateX.value;
    })
    .onUpdate((e) => {
      const raw = dragStartX.value + e.translationX;
      const min = -pageWidth;
      const max = 0;
      if (raw > max) {
        translateX.value = max + (raw - max) * DRAG_ELASTIC;
      } else if (raw < min) {
        translateX.value = min + (raw - min) * DRAG_ELASTIC;
      } else {
        translateX.value = raw;
      }
    })
    .onEnd((e) => {
      const restX = -page * pageWidth;
      const delta = translateX.value - restX;
      let next = page;
      if (delta < -pageWidth * 0.2 || e.velocityX < -VELOCITY_THRESHOLD) {
        next = Math.min(1, page + 1) as 0 | 1;
      } else if (delta > pageWidth * 0.2 || e.velocityX > VELOCITY_THRESHOLD) {
        next = Math.max(0, page - 1) as 0 | 1;
      }
      translateX.value = withSpring(-next * pageWidth, SPRING_CONFIG);
      if (next !== page) {
        runOnJS(commitPage)(next, page);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const cards = [
    { kind: DEBIT_CARD, rotation: rotationDebit, tap: tapDebit, active: page === 0 },
    { kind: CHECKING_CARD, rotation: rotationChecking, tap: tapChecking, active: page === 1 },
  ];

  // A paging carousel always docks its current page at the same on-screen
  // slot (x = SCREEN_MARGIN) regardless of which card that is — so the
  // shadow + particles can live *outside* the draggable row, at a fixed
  // position, just swapping which variant they show for `page`. Nothing
  // clips them there, unlike the row's own card-face content.
  return (
    <View onLayout={onLayout}>
      <View style={{ height: cardHeight }}>
        {cardWidth > 0 && (
          <>
            <View
              style={[
                styles.cardShadow,
                { left: SCREEN_MARGIN, width: cardWidth, height: cardHeight },
                page === 0 ? theme.shadows.cardFront : theme.shadows.cardBack,
              ]}
            />
            <GestureDetector gesture={pan}>
              <Animated.View
                style={[styles.row, { left: SCREEN_MARGIN, gap: CARD_GAP }, rowStyle]}
              >
                {cards.map((c, i) => (
                  <CarouselCard
                    key={i}
                    width={cardWidth}
                    active={c.active}
                    kind={c.kind}
                    rotation={c.rotation}
                    tap={c.tap}
                  />
                ))}
              </Animated.View>
            </GestureDetector>
            <View
              pointerEvents="none"
              style={[styles.particleSlot, { left: SCREEN_MARGIN, width: cardWidth, height: cardHeight }]}
            >
              <ParticleField
                width={cardWidth}
                height={cardHeight}
                color={page === 0 ? theme.colors.actionPrimaryDefault : theme.colors.purple['01']}
                burstTrigger={particleBurst}
              />
            </View>
          </>
        )}
      </View>

      <View style={[styles.dots, { marginTop: DOTS_GAP_FROM_CARD }]}>
        <PageDot active={page === 0} onPress={() => goToPage(0)} />
        <PageDot active={page === 1} onPress={() => goToPage(1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
  },
  cardShadow: {
    position: 'absolute',
    top: 0,
    borderRadius: CARD_RADIUS,
    // Transparent — this layer exists only to cast the shadow behind the
    // actual card (which paints its own shader background on top); a solid
    // fill here shows through as a white mask in the gap around the card.
    backgroundColor: 'transparent',
  },
  flipRoot: {
    aspectRatio: CARD_ASPECT,
  },
  cardClip: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  face: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
  backFace: {
    // Sits in the exact same box as the front face — only the rotation
    // (always 180deg apart) decides which one is actually facing the
    // viewer at any given moment.
  },
  particleSlot: {
    position: 'absolute',
    top: 0,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotHitbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.purple['01'],
  },
}));
