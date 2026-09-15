import { Image, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { Bill } from '../data/mockBills';

type Props = {
  bills: Bill[];
  label?: string;
};

/**
 * Compact "which billers use this card" summary — a row of logo+name chips.
 * Used inside CardDetailsSheet, where the full bill list (with amounts) isn't
 * in view; the chip only needs to answer "which brands", not "how much".
 */
export function PayableBillersRow({ bills, label = 'Pay with this card' }: Props) {
  if (bills.length === 0) return null;

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {bills.map((bill) => (
          <View key={bill.id} style={styles.chip}>
            <Image source={bill.logo} style={styles.chipLogo} />
            <Text style={styles.chipName} numberOfLines={1}>
              {bill.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: theme.spacing.denser,
  },
  label: {
    ...theme.typography.labelSm,
    color: theme.colors.textSubdued,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.denser,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.base,
    paddingVertical: 3,
    paddingRight: theme.spacing.denser,
    paddingLeft: 3,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceSubdued,
  },
  chipLogo: {
    width: 18,
    height: 18,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.purple[100],
  },
  chipName: {
    ...theme.typography.bodyMd,
    fontSize: 12.5,
    color: theme.colors.textDefault,
  },
}));
