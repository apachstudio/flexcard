import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native-unistyles';

import FaceIdIconOnDark from '../../assets/icons/card/face-id-on-dark.svg';
import FaceIdIconOnLight from '../../assets/icons/card/face-id-on-light.svg';
import MastercardMark from '../../assets/icons/card/mastercard.svg';

/** "Copy" label that swaps to "Copied" briefly after a tap. */
function CopyAffordance({ value, dark }: { value: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  const onPress = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    // Gesture.Native() marks this subtree as already handled by a plain RN
    // touchable, so the card's ancestor flip-Tap gesture (see CardCarousel)
    // yields to it instead of racing it — otherwise tapping Copy would also
    // flip the card.
    <GestureDetector gesture={Gesture.Native()}>
      <Pressable onPress={onPress} hitSlop={8}>
        <Text style={dark ? styles.copiedLabelOnLight : styles.copiedLabelOnDark}>
          {copied ? 'Copied' : 'Copy'}
        </Text>
      </Pressable>
    </GestureDetector>
  );
}

/** Front-face teaser — no sensitive details, just a flip affordance. */
function SeeCardDetailsCta({ dark }: { dark?: boolean }) {
  const Icon = dark ? FaceIdIconOnLight : FaceIdIconOnDark;
  return (
    <View style={styles.ctaRow}>
      <Icon width={20} height={20} />
      <Text style={dark ? styles.ctaLabelOnLight : styles.ctaLabelOnDark}>See card details</Text>
    </View>
  );
}

export function DebitCardTeaser() {
  return (
    <View style={styles.face}>
      <View style={styles.topRow}>
        <View style={styles.wordmarkGroup}>
          <Text style={styles.wordmarkOnDark}>flex</Text>
          <Text style={styles.debitSubtitle}>Debit Card</Text>
        </View>
        <MastercardMark width={36} height={25} />
      </View>
      <SeeCardDetailsCta />
    </View>
  );
}

export function CheckingAccountTeaser() {
  return (
    <View style={styles.face}>
      <View style={styles.topRow}>
        <View style={styles.wordmarkGroup}>
          <Text style={styles.wordmarkOnLight}>flex</Text>
          <Text style={styles.checkingLabel}>Checking Account</Text>
        </View>
      </View>
      <SeeCardDetailsCta dark />
    </View>
  );
}

export function DebitCardFace() {
  return (
    <View style={styles.face}>
      <View style={styles.topRow}>
        <View style={styles.wordmarkGroup}>
          <Text style={styles.wordmarkOnDark}>flex</Text>
          <Text style={styles.debitSubtitle}>Debit Card</Text>
        </View>
        <MastercardMark width={36} height={25} />
      </View>
      <View style={styles.debitDetails}>
        <View style={styles.cardNumberRow}>
          <Text style={styles.mutedOnDarkLg}>1234 5678 9012 1234</Text>
          <CopyAffordance value="1234 5678 9012 1234" />
        </View>
        <View style={styles.expCvcRow}>
          <View style={styles.expCvcItem}>
            <Text style={[styles.mutedOnDark, styles.opacity40]}>Exp</Text>
            <Text style={styles.mutedOnDarkLg}>08/30</Text>
          </View>
          <View style={styles.expCvcItem}>
            <Text style={[styles.mutedOnDark, styles.opacity40]}>CVC</Text>
            <Text style={[styles.mutedOnDarkLg, styles.opacity78]}>783</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function CheckingAccountCardFace() {
  return (
    <View style={styles.face}>
      <View style={styles.topRow}>
        <View style={styles.wordmarkGroup}>
          <Text style={styles.wordmarkOnLight}>flex</Text>
          <Text style={styles.checkingLabel}>Checking Account</Text>
        </View>
      </View>
      <View style={styles.checkingDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Routing number</Text>
          <View style={styles.detailValueRow}>
            <Text style={styles.detailValue}>9876543212834</Text>
            <CopyAffordance value="9876543212834" dark />
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account number</Text>
          <View style={styles.detailValueRow}>
            <Text style={styles.detailValue}>003280893244</Text>
            <CopyAffordance value="003280893244" dark />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  ctaRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.denser,
  },
  ctaLabelOnDark: {
    ...theme.typography.bodyBold,
    color: theme.colors.textOffWhite,
  },
  ctaLabelOnLight: {
    ...theme.typography.bodyBold,
    color: theme.colors.purple['01'],
  },
  face: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmarkGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.dense,
  },
  wordmarkOnDark: {
    ...theme.typography.wordmark,
    color: theme.colors.textOffWhite,
  },
  wordmarkOnLight: {
    ...theme.typography.wordmark,
    color: theme.colors.purple['01'],
  },
  debitSubtitle: {
    ...theme.typography.labelSm,
    color: '#D9CDF0',
    opacity: 0.4,
  },
  checkingLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.purple['01'],
    opacity: 0.6,
  },
  debitDetails: {
    gap: theme.spacing.dense,
  },
  cardNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.denser,
  },
  mutedOnDark: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.purple['03'],
  },
  mutedOnDarkLg: {
    ...theme.typography.body,
    fontSize: 16,
    letterSpacing: 2.4,
    color: theme.colors.purple['03'],
  },
  opacity40: {
    opacity: 0.4,
  },
  opacity78: {
    opacity: 0.78,
  },
  copiedLabelOnDark: {
    ...theme.typography.labelSm,
    textTransform: 'uppercase',
    color: theme.colors.textOffWhite,
  },
  copiedLabelOnLight: {
    ...theme.typography.labelSm,
    textTransform: 'uppercase',
    color: theme.colors.purple['01'],
  },
  expCvcRow: {
    flexDirection: 'row',
    gap: theme.spacing.loose,
  },
  expCvcItem: {
    flexDirection: 'row',
    gap: theme.spacing.denser,
  },
  checkingDetails: {
    gap: theme.spacing.dense,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    ...theme.typography.body,
    fontSize: 14,
    letterSpacing: -0.14,
    opacity: 0.7,
    color: theme.colors.secondaryGrayPurple04,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.base,
  },
  detailValue: {
    ...theme.typography.bodyBold,
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 2.4,
    color: theme.colors.purple['01'],
  },
}));
