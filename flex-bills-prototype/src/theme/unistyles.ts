// Ultraviolet (UV) design system, transcribed from colors_and_type.css into a
// Unistyles v3 theme. Grouping/naming mirrors the CSS 1:1 so each token stays
// traceable back to its --uv-* / semantic source (see the trailing comment on
// each line). Components must reference theme.* — never hardcode a hex value.
import { StyleSheet } from 'react-native-unistyles';

import { blue, fontFamilies, green, neutral, purple, red, stone, yellow } from './tokens';

const colors = {
  // Base
  baseSurface: neutral.white, // --base-surface
  baseOnSurface: neutral.offBlack, // --base-on-surface
  basePrimary: purple['01'], // --base-primary
  baseSecondary: stone[300], // --base-secondary
  baseInteractive: purple['02'], // --base-interactive
  baseCritical: red['01'], // --base-critical
  baseWarning: yellow['01'], // --base-warning
  baseSuccess: green['01'], // --base-success

  // Background
  backgroundLighter: neutral.white, // --background-lighter
  backgroundDark: stone[100], // --background-dark
  backgroundBrandLight: purple['04'], // --background-brand-light

  // Surface
  surfaceDefault: neutral.white, // --surface-default
  surfaceSubdued: stone[100], // --surface-subdued
  surfaceBrandDefault: purple['04'], // --surface-brand-default
  surfaceSuccessDefault: green['04'], // --surface-success-default
  surfaceSuccessDark: green['01'], // --surface-success-dark
  surfaceWarningDefault: yellow['05'], // --surface-warning-default

  // Text
  textDefault: neutral.offBlack, // --text-default
  textSubdued: stone[600], // --text-subdued
  textDisabled: stone[400], // --text-disabled
  textOnDark: neutral.white, // --text-onDark
  textOnDarkSubdued: stone[100], // --text-onDarkSubdued
  textSuccess: green['01'], // --text-success
  textCritical: red['01'], // --text-critical
  textAction: purple['01'], // --text-action
  textActionOnLight: purple['02'], // --text-action.onLight

  // Border
  borderDefault: stone[300], // --border-default
  borderSubdued: stone[300], // --border-subdued
  borderHover: purple['03'], // --border-hover (brandPurple-03)
  borderActionDefault: purple['02'], // --border-action-default
  // Translucent brand-tinted hairline for the Option 2 tile treatment —
  // derived from the purple-300 primitive, not in the semantic token list.
  borderBrandTinted: 'rgba(178, 140, 244, 0.55)',

  // Icon
  iconDefault: neutral.offBlack, // --icon-default
  iconSubdued: stone[600], // --icon-subdued
  iconBrand: purple['02'], // --icon-brand
  iconOnDark: neutral.white, // --icon-onDark

  // Action
  actionPrimaryDefault: purple['02'], // --action-primary-default (bright interactive)
  actionPrimaryDark: purple['01'], // --action-primary (dark/pressed)
  actionProgressActive: purple['02'], // --action-progress-active
  // Updated to the exact #E2E2E2 ("secondary/gray/gray-03") from the latest
  // "Design Specs Update" Figma pass (was stone-300 #D4D5D8 originally).
  actionProgressInactive: '#E2E2E2',
  // --action/onlight/disabled — muted lavender-gray for inactive bottom-nav
  // tabs, from the new spec (not in the original design-system export).
  actionOnLightDisabled: '#ABA3B8',

  // Text (additions from the new spec)
  textOffWhite: '#F7F7F7', // --text/off-white — pill/wordmark text on dark fills
  // --secondary/gray-purple/gray-purple-04 — muted label on the checking
  // account card face (Routing/Account number labels).
  secondaryGrayPurple04: 'rgba(44, 25, 77, 0.4)',

  // Raw ramps kept around for the occasional bespoke need (e.g. tinted
  // tile backgrounds) that doesn't map to a named semantic token.
  purple,
  stone,
  blue,
  green,
  red,
} as const;

const spacing = {
  none: 0, // --spacing-none
  base: 4, // --spacing-base
  densest: 6, // --spacing-densest
  denser: 8, // --spacing-denser
  dense: 12, // --spacing-dense
  default: 16, // --spacing-default
  loose: 24, // --spacing-loose
  looser: 32, // --spacing-looser
} as const;

const radius = {
  none: 0, // --shape-none
  xs: 8, // --shape-xs
  sm: 12, // --shape-sm
  md: 16, // --shape-md — cards
  lg: 24, // --shape-lg — sheets
  full: 200, // --shape-full — pills / circles
} as const;

// RN can't express the CSS's multi-layer / inset box-shadows, so these are a
// single-layer, per-platform approximation of each --shadow-* token (all
// purple-tinted per the DS, never pure black).
const shadows = {
  sm: {
    shadowColor: purple['01'],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: purple['01'],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: purple['01'],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  // --shadow-bottom-nav from the original colors_and_type.css — unused until
  // the new spec's bottom nav bar.
  bottomNav: {
    shadowColor: '#0E0622',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 8,
  },
  // The two card shadows from the new spec — same purple-tinted color as the
  // rest of the DS shadows, just notably heavier (front card) and lighter
  // (back card) than any existing --shadow-* tier.
  cardFront: {
    shadowColor: '#150B25',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 34,
    elevation: 16,
  },
  cardBack: {
    shadowColor: '#150B25',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.15,
    shadowRadius: 34,
    elevation: 10,
  },
} as const;

const typography = {
  // Hero / display — Fraunces SemiBold (was Cooper Md BT)
  heroSm: { fontFamily: fontFamilies.display, fontSize: 24, lineHeight: 28 },
  heroLg: { fontFamily: fontFamilies.display, fontSize: 30, lineHeight: 33 },
  // Header — ABC Diatype Bold
  headerMd: { fontFamily: fontFamilies.sansBold, fontSize: 20, lineHeight: 25 },
  headerSm: { fontFamily: fontFamilies.sansBold, fontSize: 18, lineHeight: 23 },
  headerXs: { fontFamily: fontFamilies.sansMedium, fontSize: 15, lineHeight: 20 },
  // Body — ABC Diatype Regular/Medium
  body: { fontFamily: fontFamilies.sans, fontSize: 16, lineHeight: 22 },
  bodyBold: { fontFamily: fontFamilies.sansMedium, fontSize: 16, lineHeight: 22 },
  bodyMd: { fontFamily: fontFamilies.sans, fontSize: 14, lineHeight: 19 },
  labelSm: { fontFamily: fontFamilies.sans, fontSize: 12, lineHeight: 16 },
  // body-md-bold — bill tile biller name (14px bold, tight tracking)
  tileName: { fontFamily: fontFamilies.sansBold, fontSize: 14, lineHeight: 19, letterSpacing: -0.14 },
  // caption — 10px labels under bill amounts ("Paid on Jan 4", etc.)
  caption: { fontFamily: fontFamilies.sans, fontSize: 10, lineHeight: 14, letterSpacing: 0.1 },
  // Number (mono) — ABC Diatype Semi-Mono
  numberMd: { fontFamily: fontFamilies.mono, fontSize: 16, lineHeight: 22 },
  numberLg: { fontFamily: fontFamilies.mono, fontSize: 20, lineHeight: 26 },
  // number-bold — the per-payment $ amount on each bill tile (16px bold mono)
  numberBold: { fontFamily: fontFamilies.monoBold, fontSize: 16, lineHeight: 24, letterSpacing: -0.16 },
  // hero-sm-number — the current, larger per-payment $ amount (24px medium mono)
  numberHero: { fontFamily: fontFamilies.monoMedium, fontSize: 24, lineHeight: 34, letterSpacing: -0.48 },
  // button — the outlined full-width "Ready to pay" button label
  button: { fontFamily: fontFamilies.sansBold, fontSize: 16, lineHeight: 22, letterSpacing: -0.16 },
  // The card's "flex" wordmark — Inter Bold, per the new spec (see fontFamilies.wordmark)
  wordmark: { fontFamily: fontFamilies.wordmark, fontSize: 30, letterSpacing: -0.3 },
} as const;

const flexTheme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
};

const appThemes = {
  flex: flexTheme,
};

const breakpoints = {
  xs: 0,
};

type AppBreakpoints = typeof breakpoints;
type AppThemes = typeof appThemes;

declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UnistylesThemes extends AppThemes {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  settings: {
    initialTheme: 'flex',
  },
  breakpoints,
  themes: appThemes,
});
