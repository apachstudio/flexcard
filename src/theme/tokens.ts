// Raw color primitives, 1:1 from the Ultraviolet (UV) design system's
// colors_and_type.css --uv-* variables (genoa/src/rxp/globalStyles.ts).
// Semantic tokens in ./unistyles.ts reference these — components should
// never reach into this file directly.

export const purple = {
  50: '#F6F5FD',
  100: '#EEECFB',
  200: '#E0DCF8',
  300: '#C9BFF3',
  400: '#AD9BEA',
  500: '#9172E0',
  600: '#7F53D4',
  700: '#6A3DB8',
  800: '#5D36A1',
  900: '#4E2E84',
  950: '#301C59',
  // Legacy 4-step ramp (--uv-purple-01..05) still referenced by a few
  // semantic tokens in the CSS source.
  '01': '#2C194D',
  '02': '#6A3DB8',
  '03': '#DDC6F9',
  '04': '#EEE2FC',
  '05': '#E3E1E6',
} as const;

export const stone = {
  50: '#FAFAFA',
  100: '#F4F4F5',
  200: '#E4E5E7',
  300: '#D4D5D8',
  400: '#8D9199',
  500: '#71747A',
  600: '#52555B',
  700: '#3F4146',
  800: '#27282A',
  900: '#18191B',
  950: '#090A0B',
} as const;

export const neutral = {
  white: '#FFFFFF',
  offBlack: '#1D1D1D',
  black: '#000000',
} as const;

export const red = {
  '01': '#CE1818',
  '02': '#E27474',
  '03': '#F0BABA',
  '04': '#FAE8E8',
} as const;

export const green = {
  '01': '#01795C',
  '02': '#67AF9D',
  '03': '#B3D7CE',
  '04': '#E6F2EF',
} as const;

export const yellow = {
  '01': '#A16B00',
  '02': '#C58301',
  '03': '#F1A91B',
  '04': '#FFD789',
  '05': '#FFF4CB',
} as const;

export const blue = {
  '01': '#00359C',
  '02': '#1C53BA',
  '03': '#6CA3EB',
  '04': '#B1D4FF',
  '05': '#E5EEFF',
} as const;

// Each key here must exactly match the family name passed to useFonts() in
// App.tsx — custom OTF/TTF fonts loaded via expo-font are registered as
// distinct families per weight; `fontWeight` alone does not select the
// Bold/Medium file on iOS the way it would for a system font.
export const fontFamilies = {
  // Display — Fraunces SemiBold, per the "Design Specs Update" Figma file
  // (supersedes Cooper Md BT from the original design-system export).
  display: 'Fraunces_600SemiBold',
  sans: 'ABC Diatype',
  sansMedium: 'ABC Diatype Medium',
  sansBold: 'ABC Diatype Bold',
  mono: 'ABC Diatype Semi-Mono',
  monoMedium: 'ABC Diatype Semi-Mono Medium',
  monoBold: 'ABC Diatype Semi-Mono Bold',
  // The card's "flex" wordmark is the one place the new spec explicitly
  // calls out Inter Bold instead of ABC Diatype Bold — everything else in
  // the spec uses ABC Diatype.
  wordmark: 'Inter_700Bold',
} as const;
