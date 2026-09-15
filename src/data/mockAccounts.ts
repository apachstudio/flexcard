// Mock account identity + full card/account details, kept separate from
// mockBills.ts (which is about billers, not the payment methods themselves).
// Single source of truth for the demo numbers shown on the card back faces
// (CardFaces.tsx) AND in the fuller CardDetailsSheet.

export const CARD_HOLDER_NAME = 'Andrea Pacheco';

export const debitCardDetails = {
  number: '1234 5678 9012 1234',
  expiration: '08/30',
  cvc: '783',
  type: 'Debit',
};

export const checkingAccountDetails = {
  routingNumber: '9876543212834',
  accountNumber: '003280893244',
  type: 'Checking',
};

// Bank/contact info shown in CardDetailsSheet — same underlying bank account
// backs both the virtual card and the checking account, so this is shared.
export const bankContactDetails = {
  bankName: 'Lead Bank',
  addressLines: ['1 Broadway St, Apt 7', 'New York, New York 10015'],
  phoneNumber: '866-845-9545',
  email: 'payments@getflex.com',
};
