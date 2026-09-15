import { useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import {
  type BeamSpecs,
  type BgSpecs,
  type CardId,
  type ShaderSpecs,
  type ShadowSpecs,
  type TiltSpecs,
  hexStopToGradientStop,
  useCardSpecs,
} from '../../specs/cardSpecs';
import { BorderBeam } from '../card-effects/border-beam';
import { ParticleField } from '../card-effects/ParticleField';
import {
  CheckingAccountCardFace,
  CheckingAccountTeaser,
  DebitCardFace,
  DebitCardTeaser,
} from './CardFaces';
import { ShaderCard } from './ShaderCard';
import { VideoCard } from './VideoCard';
import type { GradientStop } from './shader';
import { flipBlockedUntil } from './flipGuard';
import {
  CARD_ASPECT,
  CARD_GAP,
  SCREEN_MARGIN,
  type CardPager,
} from './useCardPager';

const CARD_RADIUS = 14;
const DOTS_GAP_FROM_CARD = 18;
// Focus hand-off between cards (scale/opacity of the card gaining/losing the
// page) — deliberately slower and softer than the row's snap spring, so the
// swap reads as a gentle cross-fade instead of a pop.
const FOCUS_SPRING = { damping: 26, stiffness: 110, mass: 1 };
// How far a touch may travel and still count as a tap-to-flip — anything
// longer is a drag and belongs to the pager's Pan (which lives up in
// BillsScreen, wrapped around the whole scroll content).
const TAP_MAX_DISTANCE_PX = 6;
// The flip spring ("premium and sexy" bounce) lives in the specs toolbar's
// Tilt motion section — see specs/cardSpecs.ts for the defaults.

type Props = {
  pager: CardPager;
};

// The shader numbers and gradient colors (ported from the Figma "Moving
// gradient" panel) now live in the specs toolbar — see specs/cardSpecs.ts
// DEFAULT_SPECS for the Figma-matching per-card values.
type CardKind = {
  Teaser: () => React.ReactElement;
  Detail: () => React.ReactElement;
};

const DEBIT_CARD: CardKind = {
  Teaser: DebitCardTeaser,
  Detail: DebitCardFace,
};
const CHECKING_CARD: CardKind = {
  Teaser: CheckingAccountTeaser,
  Detail: CheckingAccountCardFace,
};

/** One card face's background: the Figma video capture or the live shader port. */
function CardBackground({
  mode,
  cardId,
  gradient,
  shader,
  active,
  sheenTrigger,
  children,
}: {
  mode: BgSpecs['mode'];
  cardId: CardId;
  gradient: [GradientStop, GradientStop, GradientStop];
  shader: ShaderSpecs;
  active: boolean;
  sheenTrigger?: SharedValue<number>;
  children: React.ReactNode;
}) {
  // Sheen removed per feedback — `sheenTrigger` stays plumbed (dormant) so
  // re-enabling the light pass is a one-line change here.
  void sheenTrigger;
  const inner = children;

  if (mode === 'video') {
    return (
      <VideoCard card={cardId} active={active}>
        {inner}
      </VideoCard>
    );
  }
  return (
    <ShaderCard
      gradient={gradient}
      intensity={shader.intensity}
      rotationSpeed={shader.rotationSpeed}
      zoom={shader.zoom}
      detail={shader.detail}
      warp={shader.warp}
      twist={shader.twist}
      morphSpeed={shader.morphSpeed}
      active={active}
    >
      {inner}
    </ShaderCard>
  );
}

/**
 * A single carousel card: sinks to 94% scale / 85% opacity when not the
 * active page (ported from the reference), and flips vertically (rotateX)
 * on tap — front is a no-sensitive-details teaser, back is the full detail
 * view. Each tap keeps rotating the same direction (a continuously
 * incrementing target, not a 0/180 toggle) with a bouncy spring.
 *
 * The card's shadow lives HERE, on the card's own container: iOS projects a
 * layer's shadow from the composite alpha silhouette of its children, so as
 * the faces rotate the shadow follows the card's projected shape exactly.
 * No separate opaque "caster" layer exists anymore — that layer was what
 * showed up as a hard white mask cutout mid-flip.
 */
function CarouselCard({
  width,
  active,
  cardId,
  kind,
  bg,
  shader,
  tilt,
  beam,
  shadow,
  rotation,
  tap,
  sheenTrigger,
}: {
  width: number;
  active: boolean;
  cardId: CardId;
  kind: CardKind;
  bg: BgSpecs;
  shader: ShaderSpecs;
  tilt: TiltSpecs;
  beam: BeamSpecs;
  shadow: ShadowSpecs;
  rotation: SharedValue<number>;
  tap: GestureType;
  sheenTrigger?: SharedValue<number>;
}) {
  const scale = useSharedValue(active ? 1 : 0.94);
  // Both cards share the same flip entrance (edge-on → reveal), so the
  // neighbor needs no extra fade-in — it starts at its resting opacity.
  const opacity = useSharedValue(active ? 1 : 0.85);

  useEffect(() => {
    scale.value = withSpring(active ? 1 : 0.94, FOCUS_SPRING);
    opacity.value = withSpring(active ? 1 : 0.85, FOCUS_SPRING);
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
  const perspective = tilt.perspective;
  const frontStyle = useAnimatedStyle(() => {
    const angle = ((rotation.value % 360) + 360) % 360;
    return {
      opacity: angle < 90 || angle > 270 ? 1 : 0,
      transform: [{ perspective }, { rotateX: `${rotation.value}deg` }],
    };
  });
  const backStyle = useAnimatedStyle(() => {
    const angle = ((rotation.value + 180) % 360 + 360) % 360;
    return {
      opacity: angle < 90 || angle > 270 ? 1 : 0,
      transform: [{ perspective }, { rotateX: `${rotation.value + 180}deg` }],
    };
  });

  const { Teaser, Detail } = kind;

  const gradient = useMemo(
    () =>
      shader.gradient.map(hexStopToGradientStop) as [GradientStop, GradientStop, GradientStop],
    [shader.gradient],
  );

  return (
    <Animated.View
      style={[
        { width },
        {
          // Per-card shadow (each card carries its own spec) — cast from the
          // faces' silhouette, so it tracks the flip with no caster layer.
          shadowColor: '#150B25',
          shadowOffset: { width: 0, height: shadow.offsetY },
          shadowOpacity: shadow.opacity,
          shadowRadius: shadow.blur,
        },
        containerStyle,
      ]}
    >
      <GestureDetector gesture={tap}>
        {/* GestureDetector needs a native-view direct child — BorderBeam is a
            function component, so it lives one level down. */}
        <View style={styles.flipRoot}>
          <BorderBeam
          style={styles.beamFill}
          active={active && beam.enabled}
          size={beam.size}
          colorVariant={beam.colorVariant}
          theme="dark"
          duration={beam.duration}
          strength={beam.strength}
          brightness={beam.brightness}
          hueRange={beam.hueRange}
          borderRadius={CARD_RADIUS}
        >
          <Animated.View style={[styles.cardClip, styles.face, frontStyle]}>
            <CardBackground
              mode={bg.mode}
              cardId={cardId}
              gradient={gradient}
              shader={shader}
              active={active}
              sheenTrigger={sheenTrigger}
            >
              <Teaser />
            </CardBackground>
          </Animated.View>
          <Animated.View style={[styles.cardClip, styles.face, styles.backFace, backStyle]}>
            <CardBackground
              mode={bg.mode}
              cardId={cardId}
              gradient={gradient}
              shader={shader}
              active={active}
              sheenTrigger={sheenTrigger}
            >
              <Detail />
            </CardBackground>
          </Animated.View>
          </BorderBeam>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

/** Equal-size round page dots — purple when active, gray otherwise. */
function PageDot({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.dotHitbox}>
      <View style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />
    </Pressable>
  );
}

/**
 * The paging state + Pan gesture live in `useCardPager` (owned by
 * BillsScreen and attached around the whole scroll content, so dragging the
 * bill list also pages the cards). This component renders the cards for
 * whatever the pager says.
 */
export function CardCarousel({ pager }: Props) {
  const { specs } = useCardSpecs();
  const { page, onLayout, cardWidth, cardHeight, translateX, goToPage } = pager;

  // The front card is BORN edge-on (-90°) — initializing the shared value
  // here (not in an effect) kills the 1-2 frame face-forward flash that made
  // the entrance feel chunky.
  const rotationDebit = useSharedValue(-90);
  const rotationChecking = useSharedValue(0);
  // Bumped on every flip — CardSheen answers with an immediate light pass.
  const sheenBurst = useSharedValue(0);

  // Entrance: only the FRONT card (debit) settles face-forward as the
  // screen appears — same spring as the tap-to-flip, so both flips move at
  // the same speed.
  useEffect(() => {
    rotationDebit.value = withDelay(
      150,
      withSpring(0, {
        damping: specs.debit.tilt.damping,
        stiffness: specs.debit.tilt.stiffness,
        mass: specs.debit.tilt.mass,
      }),
    );
    // Mount-only — replaying on spec tweaks would fake-flip the card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only the focused card should be flippable — otherwise a sliver of the
  // other card exposed by the drag's elastic overscroll is tappable too.
  // maxDistance keeps a short horizontal drag (which the pager's Pan claims
  // at 5px) from also counting as a successful tap.
  const makeFlipTap = (rotation: SharedValue<number>, enabled: boolean, tilt: TiltSpecs) =>
    Gesture.Tap()
      .enabled(enabled)
      .maxDistance(TAP_MAX_DISTANCE_PX)
      .onEnd((_e, success) => {
        if (!success) return;
        // A touch that began on the Copy affordance copies — never flips.
        if (Date.now() < flipBlockedUntil.value) return;
        rotation.value = withSpring(rotation.value + 180, {
          damping: tilt.damping,
          stiffness: tilt.stiffness,
          mass: tilt.mass,
        });
        sheenBurst.value += 1;
      });
  const tapDebit = makeFlipTap(rotationDebit, page === 0, specs.debit.tilt);
  const tapChecking = makeFlipTap(rotationChecking, page === 1, specs.checking.tilt);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Debit (the dark hero card) first for the entrance wow; checking second.
  const cards = [
    { id: 'debit' as CardId, kind: DEBIT_CARD, spec: specs.debit, rotation: rotationDebit, tap: tapDebit, active: page === 0 },
    { id: 'checking' as CardId, kind: CHECKING_CARD, spec: specs.checking, rotation: rotationChecking, tap: tapChecking, active: page === 1 },
  ];

  const activeSpec = page === 0 ? specs.debit : specs.checking;

  return (
    <View onLayout={onLayout}>
      <View style={{ height: cardHeight }}>
        {cardWidth > 0 && (
          <>
            <Animated.View
              style={[styles.row, { left: SCREEN_MARGIN, gap: CARD_GAP }, rowStyle]}
            >
              {cards.map((c, i) => (
                <CarouselCard
                  key={i}
                  width={cardWidth}
                  active={c.active}
                  cardId={c.id}
                  kind={c.kind}
                  bg={c.spec.bg}
                  shader={c.spec.shader}
                  tilt={c.spec.tilt}
                  beam={c.spec.beam}
                  shadow={c.spec.shadow}
                  rotation={c.rotation}
                  tap={c.tap}
                  sheenTrigger={sheenBurst}
                />
              ))}
            </Animated.View>
            {activeSpec.particles.enabled && (
              <View
                pointerEvents="none"
                style={[styles.particleSlot, { left: SCREEN_MARGIN, width: cardWidth, height: cardHeight }]}
              >
                <ParticleField
                  width={cardWidth}
                  height={cardHeight}
                  color={activeSpec.particles.color}
                  restOpacity={activeSpec.particles.restOpacity}
                  particleCount={activeSpec.particles.count}
                  maximumDiameter={activeSpec.particles.maxDiameter}
                />
              </View>
            )}
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
  flipRoot: {
    aspectRatio: CARD_ASPECT,
  },
  beamFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  cardClip: {
    borderRadius: CARD_RADIUS,
    // iOS continuous ("squircle") corner curve — smooths the radius the way
    // Apple's own cards do, instead of a plain circular arc.
    borderCurve: 'continuous',
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
    // Clip the rising dust to the card's own rounded silhouette.
    borderRadius: CARD_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotHitbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.full,
  },
  dotActive: {
    backgroundColor: '#6A3DB8',
  },
  dotInactive: {
    backgroundColor: '#C8C6CD',
  },
}));
