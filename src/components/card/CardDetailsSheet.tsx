import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import CloseIcon from '../../assets/icons/sheet/close.svg';
import { CARD_HOLDER_NAME, bankContactDetails, checkingAccountDetails, debitCardDetails } from '../../data/mockAccounts';
import type { Bill, PaymentMethod } from '../../data/mockBills';
import { PayableBillersRow } from '../PayableBillersRow';

type Field = { label: string; lines: string[] };

function fieldsFor(cardId: PaymentMethod): { title: string; fields: Field[] } {
  const typeLabel = cardId === 'debit' ? 'Card type' : 'Account type';
  const typeValue = cardId === 'debit' ? debitCardDetails.type : checkingAccountDetails.type;

  return {
    title: cardId === 'debit' ? 'Virtual card details' : 'Checking account details',
    fields: [
      { label: 'Account holder', lines: [CARD_HOLDER_NAME] },
      { label: typeLabel, lines: [typeValue] },
      { label: 'Bank name', lines: [bankContactDetails.bankName] },
      { label: 'Address', lines: bankContactDetails.addressLines },
      { label: 'Phone number', lines: [bankContactDetails.phoneNumber] },
      { label: 'Email', lines: [bankContactDetails.email] },
    ],
  };
}

function DetailField({ field }: { field: Field }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      {field.lines.map((line) => (
        <Text key={line} style={styles.fieldValue}>
          {line}
        </Text>
      ))}
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  cardId: PaymentMethod;
  bills: Bill[];
};

// A spring on the slide (not a fixed duration/easing curve) so the sheet
// settles with a touch of natural give instead of stopping dead.
const SHEET_SPRING = { damping: 26, stiffness: 220, mass: 0.9 };

/**
 * The "see more card details" surface: a bottom sheet leading with which
 * billers pay with this card/account (the thing people check most often),
 * then the account's identity + bank/contact info — fields that don't
 * already fit on the card's own back face.
 */
export function CardDetailsSheet({ visible, onClose, cardId, bills }: Props) {
  if (!visible) return null;

  const { title, fields } = fieldsFor(cardId);

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.springify().damping(SHEET_SPRING.damping).stiffness(SHEET_SPRING.stiffness).mass(SHEET_SPRING.mass)}
        exiting={SlideOutDown.springify().damping(SHEET_SPRING.damping).stiffness(SHEET_SPRING.stiffness).mass(SHEET_SPRING.mass)}
        style={styles.panel}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <CloseIcon width={28} height={33} />
          </Pressable>
          {/* Left-aligned next to the close button, per the design system
              reference — not centered on the panel. */}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <PayableBillersRow bills={bills} />

        <View style={styles.divider} />

        <View style={styles.fields}>
          {fields.map((field) => (
            <DetailField key={field.label} field={field} />
          ))}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 6, 34, 0.4)',
  },
  backdropTap: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.surfaceDefault,
    // Bespoke — noticeably rounder than the theme's own radius.lg (24), to
    // match the reference's pronounced squircle top.
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: theme.spacing.denser,
    paddingHorizontal: theme.spacing.loose,
    paddingBottom: theme.spacing.looser,
    gap: theme.spacing.loose,
    shadowColor: '#0E0622',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.stone[300],
    marginBottom: theme.spacing.dense,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.dense,
  },
  title: {
    ...theme.typography.headerSm,
    color: theme.colors.textDefault,
  },
  closeButton: {
    marginLeft: -6,
  },
  fields: {
    gap: theme.spacing.loose,
  },
  field: {
    gap: 2,
  },
  fieldLabel: {
    ...theme.typography.bodyBold,
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.textDefault,
  },
  // Same body font family as every other card value, per feedback (no
  // mono/numeric styling — this sheet is prose, not a card face).
  fieldValue: {
    ...theme.typography.body,
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.textSubdued,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSubdued,
    opacity: 1,
  },
}));
