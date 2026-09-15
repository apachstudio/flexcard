import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

import { BottomNavBar } from '../components/BottomNavBar';

type Props = {
  onBillsPress?: () => void;
};

/** Home tab — a plain light-gray placeholder; Bills is the real destination. */
export function HomeScreen({ onBillsPress }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content} />
      <BottomNavBar active="home" onBillsPress={onBillsPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubdued,
  },
  content: {
    flex: 1,
  },
}));
