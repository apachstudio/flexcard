import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import AddBillButton from '../assets/icons/card/add-bill-button.svg';

type Props = {
  onAddBill?: () => void;
};

export function BillsHeader({ onAddBill }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>Bills</Text>
      <Pressable onPress={onAddBill} accessibilityRole="button" accessibilityLabel="Add bill">
        <AddBillButton width={44} height={44} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.dense,
  },
  title: {
    ...theme.typography.heroLg,
    color: theme.colors.textDefault,
  },
}));
