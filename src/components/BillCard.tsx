import { Image, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import type { Bill } from '../data/mockBills';
import { ProgressBar } from './ProgressBar';
import { ReadyToPayButton } from './ReadyToPayButton';

type Props = {
  bill: Bill;
  scrollTick: SharedValue<number>;
};

/**
 * The one, unified bill card from the "Design Specs Update" spec — replaces
 * the old Option 1 row / Option 2 tile split entirely. Two variants:
 * dual-payment (two side-by-side payment columns) and single-payment (one
 * amount + a full-width "Ready to pay" button, stacked below it). Not
 * tappable — there's no bill-detail screen in scope.
 */
export function BillCard({ bill, scrollTick }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Image source={bill.logo} style={styles.logo} />
        <Text style={styles.name}>{bill.name}</Text>
      </View>

      {bill.kind === 'dual' ? (
        <View style={styles.paymentRow}>
          {bill.payments.map((payment, index) => (
            <View key={index} style={styles.paymentColumn}>
              <Text style={styles.amount}>{payment.amount}</Text>
              <View style={styles.labelAndBar}>
                <Text style={styles.label} numberOfLines={1}>
                  {payment.label}
                </Text>
                <ProgressBar paid={payment.paid} scrollTick={scrollTick} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.singleColumn}>
          <View style={styles.amountAndLabel}>
            <Text style={styles.amount}>{bill.amount}</Text>
            <Text style={styles.label}>{bill.label}</Text>
          </View>
          <ReadyToPayButton />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.stone[50],
    borderWidth: 0.5,
    borderColor: theme.colors.borderDefault,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: theme.spacing.default,
    paddingVertical: theme.spacing.loose,
    gap: theme.spacing.loose,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.denser,
  },
  logo: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.purple[100],
  },
  name: {
    ...theme.typography.tileName,
    color: theme.colors.textDefault,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: theme.spacing.looser,
  },
  paymentColumn: {
    flex: 1,
    gap: 2,
  },
  amount: {
    ...theme.typography.numberHero,
    // numberHero's stock lineHeight (34) padded ~5px of dead leading under
    // the digits — trimmed so the amount→label spacing reads as the true 8px.
    lineHeight: 28,
    color: theme.colors.textDefault,
  },
  labelAndBar: {
    gap: theme.spacing.denser,
  },
  label: {
    ...theme.typography.labelSm,
    color: theme.colors.textDefault,
  },
  singleColumn: {
    // Breathing room between the label block and the full-width button.
    gap: theme.spacing.default,
  },
  amountAndLabel: {
    // Matches the dual-payment column's amount-to-label gap exactly.
    gap: 2,
  },
}));
