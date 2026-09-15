import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import ActivityIcon from '../assets/icons/nav/activity.svg';
import BillsActiveIcon from '../assets/icons/nav/bills-active.svg';
import HomeIcon from '../assets/icons/nav/home.svg';
import SettingsIcon from '../assets/icons/nav/settings.svg';

type Props = {
  /** Which tab this bar is rendered under. */
  active: 'home' | 'bills';
  onBillsPress?: () => void;
  onHomePress?: () => void;
};

/**
 * Bottom nav — Home and Bills are real destinations; tapping Bills while
 * already on it reloads the page content. Activity/Settings are visual-only.
 */
export function BottomNavBar({ active, onBillsPress, onHomePress }: Props) {
  return (
    <View style={styles.bar}>
      <Pressable style={styles.tab} onPress={onHomePress} accessibilityLabel="Home">
        <HomeIcon width={32} height={32} />
        <Text style={active === 'home' ? styles.labelActive : styles.labelInactive}>Home</Text>
      </Pressable>
      <Pressable style={styles.tab} onPress={onBillsPress} accessibilityLabel="Bills">
        <View style={styles.billsIconSlot}>
          <BillsActiveIcon width={24} height={24} />
        </View>
        <Text style={active === 'bills' ? styles.labelActive : styles.labelInactive}>Bills</Text>
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
