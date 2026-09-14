import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import ActivityIcon from '../assets/icons/nav/activity.svg';
import BillsActiveIcon from '../assets/icons/nav/bills-active.svg';
import HomeIcon from '../assets/icons/nav/home.svg';
import SettingsIcon from '../assets/icons/nav/settings.svg';

type Props = {
  onBillsPress?: () => void;
};

/**
 * Static bottom nav from the new spec — Bills is the only meaningfully
 * "active" tab in this single-screen prototype; the others are visual only.
 * Tapping Bills replays the brand curtain reveal (ported from the Figma
 * Make reference, where it's the same "Replay page transition" affordance).
 */
export function BottomNavBar({ onBillsPress }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.tab}>
        <HomeIcon width={32} height={32} />
        <Text style={styles.labelInactive}>Home</Text>
      </View>
      <Pressable style={styles.tab} onPress={onBillsPress} accessibilityLabel="Replay page transition">
        <View style={styles.billsIconSlot}>
          <BillsActiveIcon width={24} height={24} />
        </View>
        <Text style={styles.labelActive}>Bills</Text>
      </Pressable>
      <View style={styles.tab}>
        <ActivityIcon width={32} height={32} />
        <Text style={styles.labelInactive}>Activity</Text>
      </View>
      <View style={styles.tab}>
        <SettingsIcon width={32} height={32} />
        <Text style={styles.labelInactive}>Settings</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceDefault,
    ...theme.shadows.bottomNav,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.base,
    paddingTop: theme.spacing.denser,
    paddingBottom: theme.spacing.loose,
  },
  billsIconSlot: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelActive: {
    ...theme.typography.labelSm,
    color: '#2C194D',
  },
  labelInactive: {
    ...theme.typography.labelSm,
    color: theme.colors.actionOnLightDisabled,
  },
}));
