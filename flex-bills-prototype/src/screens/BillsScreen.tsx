import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { BillCard } from '../components/BillCard';
import { BillsHeader } from '../components/BillsHeader';
import { BottomNavBar } from '../components/BottomNavBar';
import { BrandCurtain } from '../components/BrandCurtain';
import { CardCarousel } from '../components/card/CardCarousel';
import { EmptyBillsState } from '../components/EmptyBillsState';
import { billsForPaymentMethod, type PaymentMethod } from '../data/mockBills';

/**
 * Bills tab — rebuilt against the Figma "Design Specs Update" file
 * (4IW9uh7Bgquo5ccIGu0ryL), with the card carousel + brand curtain ported
 * from the companion Figma Make prototype (1fnvAVEmHKqu5kGq7X9lrh). The
 * card carousel (debit ↔ checking account) filters the bill list below to
 * whichever payment method is in focus; each card change re-triggers the
 * list's staggered entrance instead of a hard cut.
 */
export function BillsScreen() {
  const [focusedMethod, setFocusedMethod] = useState<PaymentMethod>('debit');
  const [curtainRunId, setCurtainRunId] = useState(0);
  const bills = billsForPaymentMethod(focusedMethod);

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
        <View style={styles.headerPadding}>
          <BillsHeader />
        </View>
        <CardCarousel onFocusChange={setFocusedMethod} />
        <View key={focusedMethod} style={styles.billListPadding}>
          {bills.length === 0 ? (
            <EmptyBillsState />
          ) : (
            bills.map((bill, index) => (
              <Animated.View
                key={bill.id}
                entering={FadeInDown.duration(400).delay(index * 70)}
                exiting={FadeOut.duration(160)}
              >
                <BillCard bill={bill} scrollTick={scrollTick} />
              </Animated.View>
            ))
          )}
        </View>
      </Animated.ScrollView>
      <BottomNavBar onBillsPress={() => setCurtainRunId((r) => r + 1)} />
      <BrandCurtain runId={curtainRunId} />
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
