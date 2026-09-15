import { useCallback, useEffect, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withSpring } from 'react-native-reanimated';

import type { PaymentMethod } from '../../data/mockBills';

export type SwipeDirection = 'toRight' | 'toLeft';

export const CARD_GAP = 2;
export const SCREEN_MARGIN = 24;
export const CARD_ASPECT = 354 / 216;

// Tuned "much more sensitive and fluid" per feedback: the pan arms after just
// a few horizontal points, commits on a shorter distance and a much lower
// fling velocity, and the drag itself follows the finger 1:1 (with a softer
// elastic only past the edges).
const PAN_ACTIVATION_PX = 5;
const PAN_VERTICAL_TOLERANCE_PX = 20;
const VELOCITY_THRESHOLD = 350;
const COMMIT_DISTANCE_FRACTION = 0.12;
const DRAG_ELASTIC = 0.3;
// Slower, softer settle for the page-to-page snap — the drag itself stays
// 1:1 responsive (see PAN_ACTIVATION_PX etc above); only the release/commit
// spring got gentler per feedback.
export const SPRING_CONFIG = { damping: 22, stiffness: 140, mass: 0.9 };

export type CardPager = ReturnType<typeof useCardPager>;

/**
 * Owns the carousel's paging state and its horizontal Pan gesture, so the
 * gesture can be attached ABOVE the carousel (around the whole screen's
 * scroll content) — dragging the bill list below the cards pages them too.
 * Vertical scrolling still wins on vertical movement via failOffsetY.
 */
export function useCardPager(
  onFocusChange?: (method: PaymentMethod, direction: SwipeDirection) => void,
  /** Bump to reset the pager to page 0 (a "page reload"). */
  resetKey = 0,
) {
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

  // A reload snaps the pager back to the first card, instantly.
  useEffect(() => {
    setPage(0);
    translateX.value = 0;
  }, [resetKey, translateX]);

  const commitPage = useCallback(
    (next: 0 | 1, prev: 0 | 1) => {
      if (next === prev) return;
      setPage(next);
      // Page 0 is the DEBIT card (the dark hero), page 1 the checking account.
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
    // A short horizontal arm distance so the drag catches quickly, while
    // vertical movement hands the touch to the list's own scroll.
    .activeOffsetX([-PAN_ACTIVATION_PX, PAN_ACTIVATION_PX])
    .failOffsetY([-PAN_VERTICAL_TOLERANCE_PX, PAN_VERTICAL_TOLERANCE_PX])
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
      if (delta < -pageWidth * COMMIT_DISTANCE_FRACTION || e.velocityX < -VELOCITY_THRESHOLD) {
        next = Math.min(1, page + 1) as 0 | 1;
      } else if (delta > pageWidth * COMMIT_DISTANCE_FRACTION || e.velocityX > VELOCITY_THRESHOLD) {
        next = Math.max(0, page - 1) as 0 | 1;
      }
      translateX.value = withSpring(-next * pageWidth, {
        ...SPRING_CONFIG,
        velocity: e.velocityX,
      });
      if (next !== page) {
        runOnJS(commitPage)(next, page);
      }
    });

  return { page, onLayout, cardWidth, cardHeight, pageWidth, translateX, pan, goToPage };
}
