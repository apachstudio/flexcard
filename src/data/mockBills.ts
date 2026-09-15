// Mock data, transcribed from the Figma "Design Specs Update" file
// (4IW9uh7Bgquo5ccIGu0ryL, frames 1:488 "1 Credit Card" / 1:595
// "2 Checking Account"). Display-only — no real payment logic.
//
// Two notes on following the spec literally vs. correcting obvious mistakes:
// - The Figma mock labels the Yardi biller "Yard" (a text-truncation typo —
//   every other reference to this biller, including the Figma file's own
//   avatar image name, says Yardi). Corrected here.
// - Every bill tile's Figma node is named "Bill Tile — GEICO" regardless of
//   which biller it actually shows — clearly an unrenamed duplicated
//   instance, not a naming rule. Only the rendered text content is
//   authoritative; the data below follows that, not the node names.
import type { ImageSourcePropType } from 'react-native';

export type PaymentMethod = 'debit' | 'checking';

export type Payment = {
  amount: string;
  label: string;
  paid: boolean;
};

type BillBase = {
  id: string;
  name: string;
  logo: ImageSourcePropType;
  paymentMethod: PaymentMethod;
};

export type Bill =
  | (BillBase & { kind: 'dual'; payments: [Payment, Payment] })
  | (BillBase & { kind: 'single'; amount: string; label: string });

export const mockBills: Bill[] = [
  {
    id: 'facts-education',
    name: 'Facts Education',
    logo: require('../assets/images/billers/facts_education.png'),
    paymentMethod: 'debit',
    kind: 'single',
    amount: '$280',
    label: 'Due on Jan 14',
  },
  {
    id: 'geico',
    name: 'Geico',
    logo: require('../assets/images/billers/geico_auto-insurance.png'),
    paymentMethod: 'debit',
    kind: 'dual',
    payments: [
      { amount: '$72', label: 'Paid on Jan 4', paid: true },
      { amount: '$72', label: 'Autopay on Jan 4', paid: false },
    ],
  },
  {
    id: 't-mobile',
    name: 'T-Mobile',
    logo: require('../assets/images/billers/t-mobile_telecom.png'),
    paymentMethod: 'debit',
    kind: 'dual',
    payments: [
      { amount: '$90', label: 'Paid on Jan 4', paid: true },
      { amount: '$90', label: 'Paid on Jan 4', paid: true },
    ],
  },
  {
    id: 'yardi',
    name: 'Yardi',
    logo: require('../assets/images/billers/yardi_hoa.png'),
    paymentMethod: 'checking',
    kind: 'single',
    amount: '$320',
    label: 'Due on Jan 14',
  },
  {
    id: 'state-farm',
    name: 'State Farm',
    logo: require('../assets/images/billers/state-farm_auto-insurnace.png'),
    paymentMethod: 'checking',
    kind: 'dual',
    payments: [
      { amount: '$72', label: 'Paid on Jan 4', paid: true },
      { amount: '$72', label: 'Autopay on Jan 4', paid: false },
    ],
  },
  // Placeholder billers (reusing existing logos — no unique art yet) added
  // to stress-test "Pay with this card" at ~10 entries. Safe to delete once
  // real assets/entries replace them, or once the scale question is settled.
  {
    id: 'spotify',
    name: 'Spotify',
    logo: require('../assets/images/billers/facts_education.png'),
    paymentMethod: 'debit',
    kind: 'single',
    amount: '$12',
    label: 'Due on Jan 18',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    logo: require('../assets/images/billers/geico_auto-insurance.png'),
    paymentMethod: 'debit',
    kind: 'single',
    amount: '$18',
    label: 'Due on Jan 22',
  },
  {
    id: 'att',
    name: 'AT&T',
    logo: require('../assets/images/billers/t-mobile_telecom.png'),
    paymentMethod: 'debit',
    kind: 'single',
    amount: '$64',
    label: 'Due on Jan 9',
  },
  {
    id: 'chase',
    name: 'Chase',
    logo: require('../assets/images/billers/yardi_hoa.png'),
    paymentMethod: 'debit',
    kind: 'single',
    amount: '$210',
    label: 'Due on Jan 28',
  },
  {
    id: 'pge',
    name: 'PG&E',
    logo: require('../assets/images/billers/state-farm_auto-insurnace.png'),
    paymentMethod: 'debit',
    kind: 'single',
    amount: '$140',
    label: 'Due on Jan 12',
  },
  {
    id: 'verizon',
    name: 'Verizon',
    logo: require('../assets/images/billers/facts_education.png'),
    paymentMethod: 'debit',
    kind: 'single',
    amount: '$88',
    label: 'Due on Jan 15',
  },
  {
    id: 'planet-fitness',
    name: 'Planet Fitness',
    logo: require('../assets/images/billers/geico_auto-insurance.png'),
    paymentMethod: 'debit',
    kind: 'single',
    amount: '$25',
    label: 'Due on Jan 3',
  },
];

export function billsForPaymentMethod(method: PaymentMethod): Bill[] {
  return mockBills.filter((bill) => bill.paymentMethod === method);
}
