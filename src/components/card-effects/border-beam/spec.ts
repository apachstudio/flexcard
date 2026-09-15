/**
 * Typed access to the platform-neutral `beam-spec.json`, generated from the
 * web library (`npm run spec` in the repo root). To sync after a web update:
 * `npm run spec && cp spec/beam-spec.json ports/react-native/border-beam-native/src/`.
 */
import spec from './beam-spec.json';
import type { BorderBeamColorVariant, BorderBeamSize } from './types';

export interface GradientBlob {
  color: string;
  pos: string;
  size: string;
}

export interface ThemeColors {
  strokeOpacity: number;
  innerOpacity: number;
  bloomOpacity: number;
  innerShadow: string;
  saturation: number;
  brightness?: number;
  hairlineOpacity?: number;
}

export interface Oscillator {
  prop: string;
  a: number;
  b: number;
  period: number;
  delay: number;
  unit: string;
}

export const beamSpec = spec;

export function themePreset(size: BorderBeamSize, theme: 'dark' | 'light'): ThemeColors {
  return (spec.sizeThemePresets as Record<string, Record<string, ThemeColors>>)[size][theme];
}

export function sizePreset(size: BorderBeamSize): { borderRadius: number; borderWidth: number } {
  return (spec.sizePresets as Record<string, { borderRadius: number; borderWidth: number }>)[size];
}

// ── Local "brand" variant (not in beam-spec.json) ──
// Flex card purples on the colorful palette's blob geometry — deep purple,
// brand purple, lavender and white shimmer, like light tracing a brand new
// shiny card.
const BRAND_BORDER: GradientBlob[] = [
  { color: 'rgb(221, 198, 249)', pos: '33% -7.4%', size: '70px 40px' },
  { color: 'rgb(106, 61, 184)', pos: '12% -5%', size: '60px 35px' },
  { color: 'rgb(117, 63, 182)', pos: '2.1% 68.3%', size: '40px 70px' },
  { color: 'rgb(255, 255, 255)', pos: '2.1% 68.3%', size: '20px 35px' },
  { color: 'rgb(106, 61, 184)', pos: '74.4% 100%', size: '180px 32px' },
  { color: 'rgb(160, 132, 195)', pos: '55% 100%', size: '85px 26px' },
  { color: 'rgb(199, 173, 230)', pos: '93.9% 0%', size: '74px 32px' },
  { color: 'rgb(255, 255, 255)', pos: '100% 27.1%', size: '26px 42px' },
  { color: 'rgb(180, 90, 255)', pos: '100% 27.1%', size: '52px 48px' },
];

const BRAND_SMALL: { border: GradientBlob[]; inner: GradientBlob[] } = {
  border: [
    { color: 'rgb(117, 63, 182)', pos: '2% 68%', size: '9px 18px' },
    { color: 'rgb(255, 255, 255)', pos: '2% 68%', size: '4px 8px' },
    { color: 'rgb(199, 173, 230)', pos: '72% -3%', size: '59px 9px' },
    { color: 'rgb(106, 61, 184)', pos: '74% 100%', size: '42px 7px' },
    { color: 'rgb(255, 255, 255)', pos: '100% 27%', size: '10px 17px' },
    { color: 'rgb(180, 90, 255)', pos: '100% 27%', size: '10px 18px' },
    { color: 'rgb(106, 61, 184)', pos: '100% 27%', size: '5px 10px' },
    { color: 'rgb(221, 198, 249)', pos: '100% 27%', size: '11px 12px' },
  ],
  inner: [
    { color: 'rgba(117, 63, 182, 0.5)', pos: '2% 68%', size: '9px 18px' },
    { color: 'rgba(255, 255, 255, 0.45)', pos: '2% 68%', size: '4px 8px' },
    { color: 'rgba(199, 173, 230, 0.35)', pos: '72% -3%', size: '59px 9px' },
    { color: 'rgba(106, 61, 184, 0.35)', pos: '74% 100%', size: '42px 7px' },
    { color: 'rgba(255, 255, 255, 0.3)', pos: '100% 27%', size: '10px 17px' },
    { color: 'rgba(180, 90, 255, 0.4)', pos: '100% 27%', size: '10px 18px' },
    { color: 'rgba(106, 61, 184, 0.3)', pos: '100% 27%', size: '5px 10px' },
    { color: 'rgba(221, 198, 249, 0.3)', pos: '100% 27%', size: '11px 12px' },
  ],
};

export function borderPalette(variant: BorderBeamColorVariant): GradientBlob[] {
  if (variant === 'brand') return BRAND_BORDER;
  return (spec.palettes.border as Record<string, { border: GradientBlob[] }>)[variant].border;
}

export function smallPalette(variant: BorderBeamColorVariant): { border: GradientBlob[]; inner: GradientBlob[] } {
  if (variant === 'brand') return BRAND_SMALL;
  return (spec.palettes.small as Record<string, { border: GradientBlob[]; inner: GradientBlob[] }>)[variant];
}

// ── CSS value parsing (same semantics as BorderBeamKit/BeamSpec.swift) ──

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parses "rgb(r, g, b)" / "rgba(r, g, b, a)" / "transparent" (0-1 channels). */
export function parseCssColor(css: string): RGBA | null {
  const s = css.trim();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (!m) return null;
  return {
    r: parseFloat(m[1]) / 255,
    g: parseFloat(m[2]) / 255,
    b: parseFloat(m[3]) / 255,
    a: m[4] != null ? parseFloat(m[4]) : 1,
  };
}

/** Parses "33% -7.4%" → { x: 0.33, y: -0.074 }. */
export function parsePercentPair(value: string): { x: number; y: number } {
  const parts = value.split(' ');
  const pct = (p: string) => parseFloat(p.replace('%', '')) / 100;
  return { x: pct(parts[0] ?? '0'), y: pct(parts[1] ?? '0') };
}

/** Parses "70px 40px" → { w: 70, h: 40 } (CSS explicit-size gradient RADII). */
export function parsePixelPair(value: string): { w: number; h: number } {
  const parts = value.split(' ');
  const px = (p: string) => parseFloat(p.replace('px', ''));
  return { w: px(parts[0] ?? '0'), h: px(parts[1] ?? '0') };
}
