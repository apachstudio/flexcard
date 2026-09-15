import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet as RNStyleSheet, View } from 'react-native';
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import { MOVING_GRADIENT_SKSL, type ShaderCardParams } from './shader';

// `Make` returns null on a compile error rather than throwing — checked so a
// shader bug degrades to a flat fill instead of crashing every card on screen.
const effect = Skia.RuntimeEffect.Make(MOVING_GRADIENT_SKSL);
if (!effect) {
  console.error('[ShaderCard] Failed to compile MOVING_GRADIENT_SKSL — falling back to a flat fill.');
}

type Props = ShaderCardParams & {
  children?: React.ReactNode;
  /**
   * The carousel mounts 4 of these (both faces of both cards) but only the
   * active card is ever meant to be seen live — the noise-based normal in
   * the shader costs ~30 perlin/hash evaluations per pixel, so continuously
   * re-running that for cards nobody is looking at is pure waste. When
   * false, this renders a static flat-color approximation instead of the
   * live Canvas/Shader, freeing that GPU cost entirely. Defaults to true.
   */
  active?: boolean;
};

function toRgba({ r, g, b, a }: { r: number; g: number; b: number; a: number }) {
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

/** Renders the ported "Moving gradient" SKSL shader, sized to its own layout. */
export function ShaderCard({
  gradient,
  intensity,
  rotationSpeed,
  zoom,
  detail,
  warp,
  twist,
  morphSpeed,
  active = true,
  children,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const clock = useClock();

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const uniforms = useDerivedValue(() => {
    const [s0, s1, s2] = gradient;
    return {
      time: clock.value * 0.001,
      resolution: [size.width || 1, size.height || 1],
      color0: [s0.color.r, s0.color.g, s0.color.b, s0.color.a],
      color1: [s1.color.r, s1.color.g, s1.color.b, s1.color.a],
      color2: [s2.color.r, s2.color.g, s2.color.b, s2.color.a],
      stop0: s0.position,
      stop1: s1.position,
      stop2: s2.position,
      rotationSpeedPercent: rotationSpeed,
      zoomPercent: zoom,
      intensity,
      detail,
      warpAmount: warp,
      twistAmount: twist,
      morphSpeed,
    };
  }, [clock, gradient, intensity, rotationSpeed, zoom, detail, warp, twist, morphSpeed, size.width, size.height]);

  return (
    <View onLayout={onLayout} style={RNStyleSheet.absoluteFill}>
      {size.width > 0 && (
        <>
          {active && effect ? (
            <Canvas style={RNStyleSheet.absoluteFill}>
              <Fill>
                <Shader source={effect} uniforms={uniforms} />
              </Fill>
            </Canvas>
          ) : (
            <View
              style={[RNStyleSheet.absoluteFill, { backgroundColor: toRgba(gradient[1].color) }]}
            />
          )}
        </>
      )}
      {children}
    </View>
  );
}
