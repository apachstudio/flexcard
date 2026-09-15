import { type StyleProp, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { checkingAccountDetails, debitCardDetails } from '../../data/mockAccounts';
import { showToast } from '../Toast';
import { Shimmer } from './Shimmer';

import MastercardMark from '../../assets/icons/card/mastercard.svg';
import { blockFlipBriefly } from './flipGuard';

/** Two overlapping rounded squares — the copy glyph from the reference. */
function CopyIcon({ color }: { color: string }) {
  return (
    <View style={styles.copyIcon}>
      <View style={[styles.copyIconBack, { backgroundColor: color }]} />
      <View style={[styles.copyIconFront, { backgroundColor: color }]} />
    </View>
  );
}

/**
 * Invisible tap target laid over the copy icon (the icon itself lives inside
 * the row's Shimmer mask, so it can't own the gesture).
 */
function CopyHitTarget({
  value,
  toastMessage,
  onCopied,
}: {
  value: string;
  toastMessage: string;
  onCopied?: () => void;
}) {
  const doCopy = async () => {
    onCopied?.();
    await Clipboard.setStringAsync(value);
    showToast(toastMessage);
  };

  // An RNGH Tap instead of a Pressable: its onTouchesDown runs on the UI
  // thread the instant the finger lands, stamping the flip guard BEFORE the
  // card's flip Tap can possibly fire its onEnd — so Copy copies, never flips.
  const copyTap = Gesture.Tap()
    .maxDistance(12)
    .hitSlop(10)
    .onTouchesDown(() => {
      blockFlipBriefly();
    })
    .onEnd((_e, success) => {
      if (success) runOnJS(doCopy)();
    });

  return (
    <GestureDetector gesture={copyTap}>
      <View style={styles.copyHit} />
    </GestureDetector>
  );
}

/**
 * A copyable value row: text + copy icon, and the whole row gives a subtle
 * scale pulse the moment a copy lands.
 */
function CopyableValue({
  value,
  toastMessage,
  fill,
  shimmerDelay = 0,
  textStyle,
  rowStyle,
  align = 'start',
}: {
  value: string;
  toastMessage: string;
  /** Shimmer resting fill — the visible color of text AND copy icon. */
  fill: string;
  shimmerDelay?: number;
  textStyle: StyleProp<TextStyle>;
  rowStyle: StyleProp<ViewStyle>;
  /** How the row hugs its container's cross axis (never stretch — the
      right-anchored tap target depends on the wrapper hugging the content). */
  align?: 'start' | 'center';
}) {
  const scale = useSharedValue(1);

  // A light "it was pressed" dip — no springy bounce, just in and out.
  const pulse = () => {
    scale.value = withSequence(
      withTiming(0.97, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
    );
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[align === 'center' ? styles.hugCenter : styles.hugStart, pulseStyle]}
    >
      {/* Text + icon share ONE mask, so the band sweeps across both. */}
      <Shimmer fill={fill} delay={shimmerDelay}>
        <View style={rowStyle}>
          <Text style={[textStyle, styles.maskSource]}>{value}</Text>
          <CopyIcon color="#FFFFFF" />
        </View>
      </Shimmer>
      <CopyHitTarget value={value} toastMessage={toastMessage} onCopied={pulse} />
    </Animated.View>
  );
}

/**
 * "View full details" link on the back face — opens CardDetailsSheet (owned
 * by BillsScreen). Same UI-thread flip-guard as CopyHitTarget, so tapping it
 * never also flips the card back to the front.
 */
function ViewDetailsLink({ onPress }: { onPress?: () => void }) {
  const opacity = useSharedValue(1);

  const tap = Gesture.Tap()
    .maxDistance(12)
    .hitSlop(8)
    .onTouchesDown(() => {
      blockFlipBriefly();
      // A quick dip-and-recover — feedback that the tap landed, before the
      // sheet itself finishes animating in.
      opacity.value = withSequence(
        withTiming(0.4, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
      );
    })
    .onEnd((_e, success) => {
      if (success && onPress) runOnJS(onPress)();
    });

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.viewDetailsRow, style]}>
        <Text style={styles.viewDetailsLabel}>View full details</Text>
        {/* The "›" glyph rotated 90° — points down, matching the sheet it
            opens sliding up from the bottom. */}
        <Text style={styles.viewDetailsChevron}>›</Text>
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * A little card glyph — outline + inset stripe, both plain opaque shapes so
 * they survive being painted through Shimmer's alpha mask (a two-tone icon
 * wouldn't; the mask only cares about shape, not color).
 */
function CardIcon() {
  return (
    <View style={styles.cardIcon}>
      <View style={styles.cardIconStripe} />
    </View>
  );
}

/**
 * Front-face teaser — no sensitive details, just a flip affordance, white on
 * both cards with a shimmer sweep (see Shimmer.tsx).
 */
function SeeCardDetailsCta(_props: { dark?: boolean }) {
  return (
    <View style={styles.ctaMaskSlot}>
      {/* Inverted shimmer: resting text is fully white (always legible, per
          feedback), and a soft, slow dark band passes over it — the
          opposite of the usual "bright highlight on dim text" sweep. */}
      <Shimmer
        fill="#FFFFFF"
        bandWidth={130}
        pause={1300}
        duration={2200}
        bandColorRGB="21,11,37"
        bandOpacity={0.5}
      >
        <View style={styles.ctaRow}>
          <CardIcon />
          <Text style={styles.ctaLabel}>See card details</Text>
        </View>
      </Shimmer>
    </View>
  );
}

export function DebitCardTeaser() {
  return (
    <View style={styles.face}>
      <View style={styles.topRow}>
        <View style={styles.wordmarkGroup}>
          <Text style={styles.wordmarkOnDark}>flex</Text>
          <Text style={styles.debitSubtitle}>Virtual Card</Text>
        </View>
        <MastercardMark width={40} height={28} style={styles.mastercardMark} />
      </View>
      <SeeCardDetailsCta />
    </View>
  );
}

export function CheckingAccountTeaser() {
  return (
    <View style={styles.face}>
      <View style={styles.topRow}>
        <View style={styles.wordmarkGroup}>
          <Text style={styles.wordmarkOnLight}>flex</Text>
          <Text style={styles.checkingLabel}>Checking Account</Text>
        </View>
      </View>
      <SeeCardDetailsCta dark />
    </View>
  );
}

export function DebitCardFace({ onViewDetails }: { onViewDetails?: () => void }) {
  return (
    <View style={styles.face}>
      <View style={styles.topRow}>
        <View style={styles.wordmarkGroup}>
          <Text style={styles.wordmarkOnDark}>flex</Text>
          <Text style={styles.debitSubtitle}>Virtual Card</Text>
        </View>
        <MastercardMark width={40} height={28} style={styles.mastercardMark} />
      </View>
      <View style={styles.debitDetails}>
        <CopyableValue
          value={debitCardDetails.number}
          toastMessage="Card details copied."
          fill="rgba(221,198,249,1)"
          shimmerDelay={400}
          textStyle={styles.mutedOnDarkLg}
          rowStyle={styles.cardNumberRow}
        />
        <View style={styles.expCvcRow}>
          <View style={styles.expCvcItem}>
            <Text style={[styles.mutedOnDark, styles.opacity40]}>Exp</Text>
            <Text style={styles.mutedOnDarkLg}>{debitCardDetails.expiration}</Text>
          </View>
          <View style={styles.expCvcItem}>
            <Text style={[styles.mutedOnDark, styles.opacity40]}>CVC</Text>
            <Text style={styles.mutedOnDarkLg}>{debitCardDetails.cvc}</Text>
          </View>
        </View>
        <ViewDetailsLink onPress={onViewDetails} />
      </View>
    </View>
  );
}

export function CheckingAccountCardFace({ onViewDetails }: { onViewDetails?: () => void }) {
  return (
    <View style={styles.face}>
      <View style={styles.topRow}>
        <View style={styles.wordmarkGroup}>
          <Text style={styles.wordmarkOnLight}>flex</Text>
          <Text style={styles.checkingLabel}>Checking Account</Text>
        </View>
      </View>
      <View style={styles.checkingDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Routing number</Text>
          <CopyableValue
            value={checkingAccountDetails.routingNumber}
            toastMessage="Bank details copied."
            fill="rgba(230,217,249,1)"
            shimmerDelay={400}
            textStyle={styles.detailValue}
            rowStyle={styles.detailValueRow}
            align="center"
          />
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account number</Text>
          <CopyableValue
            value={checkingAccountDetails.accountNumber}
            toastMessage="Bank details copied."
            fill="rgba(230,217,249,1)"
            shimmerDelay={800}
            textStyle={styles.detailValue}
            rowStyle={styles.detailValueRow}
            align="center"
          />
        </View>
        <ViewDetailsLink onPress={onViewDetails} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  ctaMaskSlot: {
    alignSelf: 'flex-end',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.denser,
  },
  // Inside a Shimmer mask only the alpha matters — the visible tint (and its
  // resting opacity) comes from the Shimmer `fill`, so the mask copy of the
  // text must be fully opaque.
  maskSource: {
    opacity: 1,
  },
  hugStart: {
    alignSelf: 'flex-start',
  },
  hugCenter: {
    alignSelf: 'center',
    // Optical nudge — the numbers sat high of the labels' middle.
    marginTop: 5,
  },
  // "See card details" is white on BOTH cards — same size/weight as "View
  // full details" (bodyMd, not bold) for a consistent footer/CTA voice.
  ctaLabel: {
    ...theme.typography.bodyMd,
    fontSize: 12.5,
    color: theme.colors.textOffWhite,
  },
  cardIcon: {
    width: 16,
    height: 12,
    borderRadius: 2.5,
    borderWidth: 1.4,
    borderColor: '#FFFFFF',
  },
  cardIconStripe: {
    height: 3,
    marginTop: 2.5,
    backgroundColor: '#FFFFFF',
  },
  face: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmarkGroup: {
    flexDirection: 'row',
    // Pixel-align the small label's text baseline with the "flex" wordmark's.
    alignItems: 'baseline',
    gap: theme.spacing.denser,
  },
  // All card texts scaled to 90% per feedback.
  wordmarkOnDark: {
    ...theme.typography.wordmark,
    fontSize: 27,
    color: theme.colors.textOffWhite,
  },
  wordmarkOnLight: {
    ...theme.typography.wordmark,
    fontSize: 27,
    // Per the reference, the wordmark is white on BOTH cards — the checking
    // card's light shader still carries enough purple behind it.
    color: theme.colors.textOffWhite,
  },
  debitSubtitle: {
    ...theme.typography.labelSm,
    fontSize: 11.5,
    lineHeight: 15,
    color: '#D9CDF0',
    opacity: 0.55,
  },
  checkingLabel: {
    ...theme.typography.labelSm,
    fontSize: 11.5,
    lineHeight: 15,
    color: theme.colors.textOffWhite,
    opacity: 0.55,
  },
  debitDetails: {
    gap: theme.spacing.denser,
  },
  cardNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // Same number→icon gap as the checking rows (detailValueRow).
    gap: theme.spacing.base,
  },
  mutedOnDark: {
    ...theme.typography.body,
    fontSize: 12.5,
    color: theme.colors.purple['03'],
  },
  mutedOnDarkLg: {
    ...theme.typography.body,
    fontSize: 14.5,
    letterSpacing: 2.2,
    color: theme.colors.purple['03'],
    opacity: 0.8,
  },
  opacity40: {
    opacity: 0.4,
  },
  mastercardMark: {
    marginTop: 2,
  },
  copyIcon: {
    width: 10,
    height: 10,
  },
  copyHit: {
    position: 'absolute',
    right: -8,
    top: -8,
    bottom: -8,
    width: 34,
  },
  copyIconBack: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 7,
    height: 7,
    borderRadius: 2,
    opacity: 0.55,
  },
  copyIconFront: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  expCvcRow: {
    flexDirection: 'row',
    gap: theme.spacing.dense,
  },
  expCvcItem: {
    flexDirection: 'row',
    gap: theme.spacing.denser,
  },
  checkingDetails: {
    gap: theme.spacing.denser,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    ...theme.typography.body,
    fontSize: 12.5,
    letterSpacing: -0.13,
    opacity: 0.9,
    color: '#DDC6F9',
  },
  detailValueRow: {
    flexDirection: 'row',
    // Baseline, not center — aligns the copy icon's bottom edge with the
    // digits' baseline rather than their visual midpoint.
    alignItems: 'baseline',
    gap: theme.spacing.base,
  },
  detailValue: {
    ...theme.typography.bodyBold,
    fontSize: 14.5,
    lineHeight: 14.5,
    letterSpacing: 2.2,
    // Light lavender-white numbers on the checking card, per the reference.
    color: '#E6D9F9',
    opacity: 0.9,
  },
  // A dedicated footer row — full width, its own hairline, breathing room
  // above — instead of a small link crowded against the numbers block.
  viewDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.denser,
    paddingTop: theme.spacing.denser,
    borderTopWidth: 1,
    // White-alpha hairline (not a fixed dark/light color) so it reads
    // against both the dark debit and light checking video backgrounds,
    // same trick as the white-on-both-cards text above it.
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  viewDetailsLabel: {
    ...theme.typography.bodyMd,
    fontSize: 12.5,
    color: theme.colors.textOffWhite,
    opacity: 0.7,
  },
  viewDetailsChevron: {
    fontSize: 14,
    lineHeight: 16,
    color: theme.colors.textOffWhite,
    opacity: 0.7,
    transform: [{ rotate: '90deg' }],
  },
}));
