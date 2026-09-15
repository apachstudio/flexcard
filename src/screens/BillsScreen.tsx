import { useState } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { BillCard } from '../components/BillCard';
import { BillsHeader } from '../components/BillsHeader';
import { BottomNavBar } from '../components/BottomNavBar';
import { CardDetailsSheet } from '../components/card/CardDetailsSheet';
import { CardCarousel } from '../components/card/CardCarousel';
import { useCardPager } from '../components/card/useCardPager';
import { EmptyBillsState } from '../components/EmptyBillsState';
import { SpecsToolbar } from '../components/specs/SpecsToolbar';
import { ToastHost } from '../components/Toast';
import { billsForPaymentMethod, mockBills, type PaymentMethod } from '../data/mockBills';

type Props = {
  /** Bills tab tap — bumps `reloadId` in the parent, i.e. a page reload. */
  onBillsPress?: () => void;
  /** Home tab tap — navigates back to the Home screen. */
  onHomePress?: () => void;
  /** Remounts the page CONTENT (cards + bills) — the header stays fixed. */
  reloadId?: number;
};

/**
 * Bills tab — rebuilt against the Figma "Design Specs Update" file
 * (4IW9uh7Bgquo5ccIGu0ryL), with the card carousel + brand curtain ported
 * from the companion Figma Make prototype (1fnvAVEmHKqu5kGq7X9lrh). The bill
 * list below is one static, unfiltered list (every biller, regardless of
 * which card is showing) — which billers pay with which card is instead
 * answered inside each card's "View full details" sheet.
 */
export function BillsScreen({ onBillsPress, onHomePress, reloadId = 0 }: Props) {
  // "See more card details" — a bottom sheet with the full account identity
  // (see CardDetailsSheet). Opened from the "View full details" link on
  // whichever card's back face is showing.
  const [detailsCard, setDetailsCard] = useState<PaymentMethod | null>(null);

  // The card pager's Pan gesture wraps the cards + bill list below the
  // header, so a horizontal touch-and-drag anywhere in the content pages the
  // cards; vertical movement still belongs to the scroll. The list itself no
  // longer reacts to which card is focused, so the pager needs no callback.
  const pager = useCardPager(undefined, reloadId);

  // Drives ProgressBar's "replay the fill every time it scrolls into view"
  // behavior — it's a tick, not a meaningful value, just something for the
  // bars' useAnimatedReaction to key off of.
  const scrollTick = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollTick.value = event.contentOffset.y;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* The header sits OUTSIDE the reload-keyed subtree — a Bills-tab
            reload replays the cards + list without the header blinking. */}
        <View style={styles.headerPadding}>
          <BillsHeader />
        </View>
        <GestureDetector gesture={pager.pan}>
          <View key={reloadId}>
            <CardCarousel pager={pager} onViewDetails={setDetailsCard} />
            <View style={styles.billListPadding}>
              {mockBills.length === 0 ? (
                <EmptyBillsState />
              ) : (
                mockBills.map((bill, index) => (
                  <Animated.View key={bill.id} entering={FadeInDown.duration(400).delay(index * 70)}>
                    <BillCard bill={bill} scrollTick={scrollTick} />
                  </Animated.View>
                ))
              )}
            </View>
          </View>
        </GestureDetector>
      </Animated.ScrollView>
      <BottomNavBar active="bills" onBillsPress={onBillsPress} onHomePress={onHomePress} />
      <SpecsToolbar />
      <ToastHost />
      <CardDetailsSheet
        visible={detailsCard !== null}
        onClose={() => setDetailsCard(null)}
        cardId={detailsCard ?? 'debit'}
        bills={detailsCard ? billsForPaymentMethod(detailsCard) : []}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surfaceDefault,
  },
  scrollContent: {
    paddingBottom: theme.spacing.loose,
  },
  headerPadding: {
    paddingHorizontal: theme.spacing.loose,
    // Carousel moved up 32pt per feedback — the particle field can still
    // drift close to the header text; accepted as an intentional trade-off.
    marginBottom: 28,
  },
  billListPadding: {
    paddingHorizontal: theme.spacing.loose,
    gap: theme.spacing.dense,
    marginTop: theme.spacing.loose,
  },
}));
