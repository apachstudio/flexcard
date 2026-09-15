import { makeMutable } from 'react-native-reanimated';

/**
 * Timestamp (ms epoch) until which the card flip-tap must NOT fire.
 *
 * The Copy affordance lives inside the card face, under the card's own
 * flip Tap gesture — Gesture.Native() alone doesn't make the outer Tap wait
 * for the Pressable, so a tap on Copy would both copy AND flip. Copy's
 * onPressIn stamps this guard (touch-down happens before the outer Tap's
 * onEnd), and the flip worklet bails out while it's fresh.
 */
export const flipBlockedUntil = makeMutable(0);

const GUARD_WINDOW_MS = 600;

// A worklet so the Copy gesture can stamp the guard ON THE UI THREAD at
// touch-down — a JS-side onPressIn loses the race against the flip Tap's
// UI-thread onEnd for quick taps, which is exactly the bug this fixes.
export function blockFlipBriefly() {
  'worklet';
  flipBlockedUntil.value = Date.now() + GUARD_WINDOW_MS;
}
