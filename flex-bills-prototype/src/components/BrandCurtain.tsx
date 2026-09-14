import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  /** Bumping this replays the curtain — see BottomNavBar's Bills tap. */
  runId: number;
  onDone?: () => void;
};

/**
 * Ported from the Figma Make reference's "BrandCurtain": a full-screen
 * purple wash with a soft glow and the "flex" wordmark, that lifts away to
 * reveal the page. Plays on first mount and replays whenever `runId` changes
 * (tapping "Bills" in the bottom nav, matching the reference's behavior).
 * The reference's glow uses a CSS blur filter, which RN has no native
 * equivalent for on arbitrary views — approximated here with an SVG radial
 * gradient, which fades just as softly without needing a blur.
 */
export function BrandCurtain({ runId, onDone }: Props) {
  const translateY = useSharedValue(0);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkScale = useSharedValue(0.86);
  const underline = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.6);

  useEffect(() => {
    translateY.value = 0;
    wordmarkOpacity.value = 0;
    wordmarkScale.value = 0.86;
    underline.value = 0;
    glowOpacity.value = 0;
    glowScale.value = 0.6;

    glowOpacity.value = withTiming(0.45, { duration: 1100, easing: EASE_OUT });
    glowScale.value = withTiming(1.1, { duration: 1100, easing: EASE_OUT });
    wordmarkOpacity.value = withDelay(80, withTiming(1, { duration: 700, easing: EASE_OUT }));
    wordmarkScale.value = withDelay(80, withTiming(1, { duration: 700, easing: EASE_OUT }));
    underline.value = withDelay(340, withTiming(1, { duration: 600, easing: EASE_OUT }));

    const timer = setTimeout(() => {
      translateY.value = withTiming(
        -SCREEN_HEIGHT * 1.1,
        { duration: 900, easing: EASE_OUT },
        (finished) => {
          if (finished && onDone) onDone();
        },
      );
    }, 900);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const curtainStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ scale: wordmarkScale.value }],
  }));
  const underlineStyle = useAnimatedStyle(() => ({
    opacity: underline.value,
    transform: [{ scaleX: underline.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <Animated.View style={[styles.curtain, curtainStyle]} pointerEvents="none">
      <View style={styles.wash} />
      <Animated.View style={[styles.glowBox, glowStyle]}>
        <Svg width={520} height={520}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#A06BFF" stopOpacity={1} />
              <Stop offset="100%" stopColor="#A06BFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={520} height={520} fill="url(#glow)" />
        </Svg>
      </Animated.View>
      <View style={styles.content}>
        <Animated.Text style={[styles.wordmark, wordmarkStyle]}>flex</Animated.Text>
        <Animated.View style={[styles.underline, underlineStyle]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  curtain: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 50,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#2C194D',
  },
  glowBox: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - 260,
    top: SCREEN_HEIGHT * 0.38 - 260,
    width: 520,
    height: 520,
  },
  content: {
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: 'Inter_700Bold',
    fontSize: 52,
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  underline: {
    height: 2,
    width: 64,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
