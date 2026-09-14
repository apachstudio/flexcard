import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import SpotIllustration from '../assets/images/spot-documentwithsparkle.svg';

/**
 * Not in the reference prototype (it only shows the happy path) — added so
 * the list has a real answer for the zero-bills case. Copy is the README's
 * own example pair for "Empty bills".
 */
export function EmptyBillsState() {
  return (
    <View style={styles.container}>
      <SpotIllustration width={72} height={72} />
      <Text style={styles.title}>No bills due right now.</Text>
      <Text style={styles.body}>When a new bill comes in, you'll see it here.</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: 'center',
    gap: theme.spacing.denser,
    paddingVertical: theme.spacing.looser,
    paddingHorizontal: theme.spacing.loose,
  },
  title: {
    ...theme.typography.headerSm,
    color: theme.colors.textDefault,
    textAlign: 'center',
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.textSubdued,
    textAlign: 'center',
  },
}));
