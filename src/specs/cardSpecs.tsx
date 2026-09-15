import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type {
  BorderBeamColorVariant,
  BorderBeamSize,
} from '../components/card-effects/border-beam/types';
import type { GradientStop } from '../components/card/shader';

export type CardId = 'debit' | 'checking';

export type ParticleSpecs = {
  enabled: boolean;
  count: number;
  maxDiameter: number;
  /** Hex color of the dust dots. */
  color: string;
  /** Base opacity of the rising dust (each particle varies around it). */
  restOpacity: number;
};

export type TiltSpecs = {
  perspective: number;
  damping: number;
  stiffness: number;
  mass: number;
};

export type ShadowSpecs = {
  offsetY: number;
  blur: number;
  opacity: number;
};

export type GradientStopSpec = { position: number; hex: string };

export type ShaderSpecs = {
  // Slider names/values mirror the Figma "Moving gradient" panel 1:1.
  detail: number;
  intensity: number;
  twist: number;
  warp: number; // Figma's "Flow"
  zoom: number; // percent
  rotationSpeed: number; // Figma's "Speed", percent
  morphSpeed: number;
  gradient: [GradientStopSpec, GradientStopSpec, GradientStopSpec];
};

export type BeamSpecs = {
  enabled: boolean;
  size: BorderBeamSize;
  colorVariant: BorderBeamColorVariant;
  duration: number;
  strength: number;
  brightness: number;
  hueRange: number;
};

export type BgSpecs = {
  /** 'video' = the pixel-faithful Figma capture; 'shader' = the live SkSL port. */
  mode: 'shader' | 'video';
};

export type CardSpecs = {
  bg: BgSpecs;
  particles: ParticleSpecs;
  tilt: TiltSpecs;
  shadow: ShadowSpecs;
  shader: ShaderSpecs;
  beam: BeamSpecs;
};

// Defaults transcribed from the Figma "Moving gradient" panel instances
// (Detail/Intensity/Twist/Flow/Zoom/Speed/Morph speed + gradient stops) and
// the previously hardcoded carousel/particle/shadow constants, so "reset"
// always lands back on the Figma-matching look.
const SHARED_DEFAULTS = {
  bg: {
    mode: 'video' as const,
  },
  tilt: {
    perspective: 1700,
    damping: 34,
    stiffness: 80,
    mass: 3.4,
  },
  beam: {
    enabled: false,
    size: 'md' as BorderBeamSize,
    colorVariant: 'brand' as BorderBeamColorVariant,
    duration: 2,
    strength: 1,
    brightness: 1,
    hueRange: 30,
  },
};

export const DEFAULT_SPECS: Record<CardId, CardSpecs> = {
  debit: {
    ...structuredClone(SHARED_DEFAULTS),
    particles: {
      enabled: false,
      count: 16,
      maxDiameter: 2.84,
      // Light lavender so the dust reads against the deep-purple card face.
      color: '#EEE2FC',
      restOpacity: 0.55,
    },
    shadow: { offsetY: 14, blur: 34, opacity: 0.45 },
    shader: {
      detail: 1.1,
      intensity: 1.44,
      twist: 3.95,
      warp: 0.19,
      zoom: 94,
      rotationSpeed: 21,
      morphSpeed: 0.87,
      gradient: [
        { position: 0, hex: '#2C194D' },
        { position: 0.5, hex: '#2C194D' },
        { position: 1, hex: '#6A3DB8' },
      ],
    },
  },
  checking: {
    ...structuredClone(SHARED_DEFAULTS),
    particles: {
      enabled: false,
      count: 16,
      maxDiameter: 2.84,
      // Deep purple dust for the light lavender checking card.
      color: '#2C194D',
      restOpacity: 0.55,
    },
    shadow: { offsetY: 14, blur: 34, opacity: 0.22 },
    shader: {
      detail: 1.1,
      intensity: 1.44,
      twist: 3.95,
      warp: 0.19,
      zoom: 94,
      rotationSpeed: 21,
      morphSpeed: 0.87,
      gradient: [
        { position: 0, hex: '#C7ADE6' },
        { position: 0.5, hex: '#753FB6' },
        { position: 1, hex: '#A084C3' },
      ],
    },
  },
};

/** '#RRGGBB' → shader GradientStop (0-1 float channels). */
export function hexStopToGradientStop(stop: GradientStopSpec): GradientStop {
  const hex = stop.hex.replace('#', '');
  const int = parseInt(hex, 16);
  return {
    position: stop.position,
    color: {
      r: ((int >> 16) & 255) / 255,
      g: ((int >> 8) & 255) / 255,
      b: (int & 255) / 255,
      a: 1,
    },
  };
}

type CardSpecsContextValue = {
  specs: Record<CardId, CardSpecs>;
  setSpec: <S extends keyof CardSpecs>(
    card: CardId,
    section: S,
    patch: Partial<CardSpecs[S]>,
  ) => void;
  resetCard: (card: CardId) => void;
};

const CardSpecsContext = createContext<CardSpecsContextValue | null>(null);

export function CardSpecsProvider({ children }: { children: ReactNode }) {
  const [specs, setSpecs] = useState<Record<CardId, CardSpecs>>(() =>
    structuredClone(DEFAULT_SPECS),
  );

  const setSpec = useCallback(
    <S extends keyof CardSpecs>(card: CardId, section: S, patch: Partial<CardSpecs[S]>) => {
      setSpecs((prev) => ({
        ...prev,
        [card]: {
          ...prev[card],
          [section]: { ...prev[card][section], ...patch },
        },
      }));
    },
    [],
  );

  const resetCard = useCallback((card: CardId) => {
    setSpecs((prev) => ({ ...prev, [card]: structuredClone(DEFAULT_SPECS[card]) }));
  }, []);

  const value = useMemo(() => ({ specs, setSpec, resetCard }), [specs, setSpec, resetCard]);

  return <CardSpecsContext.Provider value={value}>{children}</CardSpecsContext.Provider>;
}

export function useCardSpecs() {
  const ctx = useContext(CardSpecsContext);
  if (!ctx) throw new Error('useCardSpecs must be used inside CardSpecsProvider');
  return ctx;
}
