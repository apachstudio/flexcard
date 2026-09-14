// SKSL port of the Figma "Moving gradient" WebGPU shader (WGSL) used for
// both card faces. Both real instances use `material: 2` (Glossy) +
// `gradientMethod: 2` (Facing).
//
// The WGSL renders an actual 3D mesh (a subdivided cube-sphere) through a
// real camera/perspective pipeline. SKSL has no 3D pipeline, so instead of
// a literal sphere, each pixel's "base direction" is approximated directly
// from its screen position — normalize(x, y, 1) — standing in for the
// vertex shader's per-vertex `baseDirection`. From there the WGSL's noise
// system (perlin3/fbm/warp) runs verbatim on that direction to build the
// same noise-displaced-surface normal (`twistedFieldNormal`) the original
// uses for its Facing/fresnel color coordinate and lighting — this is what
// produces the organic marbled streaks, not a flat gradient. That normal is
// then rotated with the same 3-axis rotation (`animatedOrientation`).
export const MOVING_GRADIENT_SKSL = `
uniform float time;
uniform float2 resolution;
uniform float4 color0;
uniform float4 color1;
uniform float4 color2;
uniform float stop0;
uniform float stop1;
uniform float stop2;
uniform float rotationSpeedPercent;
uniform float intensity;
uniform float detail;
uniform float warpAmount;
uniform float twistAmount;
uniform float morphSpeed;

float3 hash33(float3 p) {
  float3 q = float3(
    dot(p, float3(127.1, 311.7, 74.7)),
    dot(p, float3(269.5, 183.3, 246.1)),
    dot(p, float3(113.5, 271.9, 124.6))
  );
  return fract(sin(q) * 43758.5453) * 2.0 - 1.0;
}

float3 smootherCurve(float3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float gradDot(float3 cell, float3 offset, float3 local) {
  return dot(hash33(cell + offset), local - offset);
}

float perlin3(float3 p) {
  float3 cell = floor(p);
  float3 local = fract(p);
  float3 w = smootherCurve(local);

  float n000 = gradDot(cell, float3(0.0, 0.0, 0.0), local);
  float n100 = gradDot(cell, float3(1.0, 0.0, 0.0), local);
  float n010 = gradDot(cell, float3(0.0, 1.0, 0.0), local);
  float n110 = gradDot(cell, float3(1.0, 1.0, 0.0), local);
  float n001 = gradDot(cell, float3(0.0, 0.0, 1.0), local);
  float n101 = gradDot(cell, float3(1.0, 0.0, 1.0), local);
  float n011 = gradDot(cell, float3(0.0, 1.0, 1.0), local);
  float n111 = gradDot(cell, float3(1.0, 1.0, 1.0), local);

  float nx00 = mix(n000, n100, w.x);
  float nx10 = mix(n010, n110, w.x);
  float nx01 = mix(n001, n101, w.x);
  float nx11 = mix(n011, n111, w.x);
  float nxy0 = mix(nx00, nx10, w.y);
  float nxy1 = mix(nx01, nx11, w.y);

  return mix(nxy0, nxy1, w.z) * 1.1547;
}

float3 rotateOctave(float3 p) {
  return float3(
     0.00 * p.x + 0.80 * p.y + 0.60 * p.z,
    -0.80 * p.x + 0.36 * p.y - 0.48 * p.z,
    -0.60 * p.x - 0.48 * p.y + 0.64 * p.z
  );
}

float fbm(float3 p) {
  float3 q = p;
  float total = 0.0;
  float amplitude = 1.0;
  float weight = 0.0;

  for (int i = 0; i < 3; i++) {
    total += perlin3(q) * amplitude;
    weight += amplitude;
    q = rotateOctave(q) * 2.02 + float3(3.7, 1.9, 6.3);
    amplitude *= 0.48;
  }

  return total / max(weight, 0.0001);
}

float3 warpVector(float3 p) {
  return float3(
    perlin3(p),
    perlin3(p + float3(5.2, 1.3, 2.8)),
    perlin3(p + float3(1.7, 9.2, 4.4))
  );
}

float wrapPhase(float phase) {
  float tau = 6.28318530718;
  return phase - floor(phase / tau) * tau;
}

float3 curvedDomainMotion(float morphTime, float3 rates, float3 phases) {
  return float3(
    sin(wrapPhase(morphTime * rates.x + phases.x)),
    sin(wrapPhase(morphTime * rates.y + phases.y)),
    cos(wrapPhase(morphTime * rates.z + phases.z))
  );
}

float3 primaryDomainMotion(float morphTime) {
  float3 primaryDirection = normalize(float3(0.73, -0.41, 0.55));
  float3 secondaryDirection = normalize(float3(-0.28, 0.91, 0.31));
  float3 primaryDrift = primaryDirection * morphTime * 0.105;
  float3 secondaryDrift = secondaryDirection * morphTime * 0.023;
  float3 curve = curvedDomainMotion(morphTime, float3(0.071, 0.043, 0.029), float3(0.0, 1.73, 4.11)) * 0.16;
  return primaryDrift + secondaryDrift + curve;
}

float3 warpDomainMotion(float morphTime) {
  float3 primaryDirection = normalize(float3(-0.46, 0.38, 0.80));
  float3 secondaryDirection = normalize(float3(0.84, 0.51, -0.18));
  float3 primaryDrift = primaryDirection * morphTime * 0.137;
  float3 secondaryDrift = secondaryDirection * morphTime * 0.031;
  float3 curve = curvedDomainMotion(morphTime, float3(0.089, 0.053, 0.034), float3(2.21, 5.07, 0.83)) * 0.12;
  return primaryDrift + secondaryDrift + curve;
}

float heightField(float3 direction) {
  float detailLevel = clamp(detail / 5.0, 0.0, 1.0);
  float frequency = mix(1.05, 3.4, detailLevel);
  float morphTime = time * max(morphSpeed, 0.0);
  float3 primaryMotion = primaryDomainMotion(morphTime);
  float3 warpMotion = warpDomainMotion(morphTime);
  float3 p = direction * frequency + float3(1.7, 3.1, 5.3) + primaryMotion;
  float3 w = warpVector(p * 0.55 + warpMotion * 0.42 + float3(0.7, -1.1, 0.4)) * warpAmount;
  return fbm(p + w);
}

float displacementAmount() {
  float amount = clamp(detail, 0.0, 1.0);
  float easedAmount = amount * amount * (3.0 - 2.0 * amount);
  return easedAmount * 0.30 * clamp(intensity, 0.0, 5.0);
}

float3 surfacePoint(float3 direction) {
  float height = heightField(direction);
  float displacedRadius = 1.0 + height * displacementAmount();
  float safeRadius = max(displacedRadius, 0.72);
  return direction * safeRadius;
}

float3 twistAxis() {
  return normalize(float3(-0.68, 0.54, 0.49));
}

float torsionAngle(float3 direction) {
  float3 axis = twistAxis();
  float axial = clamp(dot(direction, axis), -1.0, 1.0);
  float smoothAxial = axial * (1.5 - 0.5 * axial * axial);
  return smoothAxial * clamp(twistAmount, 0.0, 7.0);
}

float3 rotateAroundAxis(float3 p, float3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
}

float3 twistedSurfacePoint(float3 direction) {
  float3 axis = twistAxis();
  float3 surf = surfacePoint(direction);
  return rotateAroundAxis(surf, axis, torsionAngle(direction));
}

float3 twistedFieldNormal(float3 direction) {
  float3 reference = float3(0.0, 1.0, 0.0);
  if (abs(direction.y) > 0.9) {
    reference = float3(1.0, 0.0, 0.0);
  }

  float3 tangent = normalize(cross(reference, direction));
  float3 bitangent = normalize(cross(direction, tangent));
  float epsilon = 0.02;

  float3 tA = twistedSurfacePoint(normalize(direction - tangent * epsilon));
  float3 tB = twistedSurfacePoint(normalize(direction + tangent * epsilon));
  float3 bA = twistedSurfacePoint(normalize(direction - bitangent * epsilon));
  float3 bB = twistedSurfacePoint(normalize(direction + bitangent * epsilon));

  float3 fieldNormal = normalize(cross(tB - tA, bB - bA));
  float3 outward = normalize(twistedSurfacePoint(direction));
  if (dot(fieldNormal, outward) < 0.0) {
    fieldNormal = -fieldNormal;
  }
  return fieldNormal;
}

float3 rotateX(float3 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return float3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

// Ported verbatim from the WGSL's animatedOrientation().
float3 animatedOrientation(float3 p, float rotationTime) {
  float3 axisA = normalize(float3(0.36, 0.81, 0.46));
  float3 axisB = normalize(float3(-0.71, 0.29, 0.64));
  float3 axisC = normalize(float3(0.58, -0.69, 0.43));

  float angleA = rotationTime * 0.287;
  float angleB = rotationTime * 0.2236068;
  float angleC = rotationTime * 0.1732051;

  float3 oriented = rotateAroundAxis(p, axisA, angleA);
  oriented = rotateAroundAxis(oriented, axisB, angleB);
  oriented = rotateAroundAxis(oriented, axisC, angleC);
  return rotateX(oriented, -0.24);
}

// sRGB <-> linear <-> Oklab, ported verbatim from the WGSL — used so
// gradient stops blend perceptually instead of a flat RGB lerp.
float3 srgbToLinear(float3 c) {
  float3 low = c / 12.92;
  float3 high = pow((c + 0.055) / 1.055, float3(2.4));
  return mix(low, high, step(float3(0.04045), c));
}

float3 linearToSrgb(float3 c) {
  float3 low = c * 12.92;
  float3 high = 1.055 * pow(c, float3(1.0 / 2.4)) - 0.055;
  return mix(low, high, step(float3(0.0031308), c));
}

float3 linearToOklab(float3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

  float lc = pow(max(l, 0.0), 1.0 / 3.0);
  float mc = pow(max(m, 0.0), 1.0 / 3.0);
  float sc = pow(max(s, 0.0), 1.0 / 3.0);

  return float3(
    0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc,
    1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc,
    0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc
  );
}

float3 oklabToLinear(float3 c) {
  float lc = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float mc = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float sc = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

  float l = lc * lc * lc;
  float m = mc * mc * mc;
  float s = sc * sc * sc;

  return float3(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

float4 gradientAt(float t) {
  float4 a;
  float4 b;
  float start;
  float end;
  if (t < stop1) {
    a = color0; b = color1; start = stop0; end = stop1;
  } else {
    a = color1; b = color2; start = stop1; end = stop2;
  }
  float amount = clamp((t - start) / max(end - start, 0.0001), 0.0, 1.0);
  amount = amount * amount * (3.0 - 2.0 * amount);

  float3 labA = linearToOklab(srgbToLinear(a.rgb));
  float3 labB = linearToOklab(srgbToLinear(b.rgb));
  float3 blended = linearToSrgb(oklabToLinear(mix(labA, labB, amount)));
  return float4(blended, mix(a.a, b.a, amount));
}

half4 main(float2 fragCoord) {
  float2 p = (fragCoord / resolution) * 2.0 - 1.0;
  p.x *= resolution.x / resolution.y;

  // Stands in for the vertex shader's per-vertex baseDirection — see file
  // header. 1.35 is a fixed curvature amount (how much the "sphere" bulges
  // across the card), tuned by eye.
  float3 direction = normalize(float3(p.x * 1.35, p.y * 1.35, 1.0));

  // Cap raised from the WGSL's original 0.25 to 0.6 — this is our own port,
  // not a literal copy, and the designer wanted the motion visibly faster.
  float rotationSpeed = min(0.6, max(0.0, (rotationSpeedPercent / 100.0) * 0.6));
  float rotationTime = time * rotationSpeed;

  // The noise-displaced-surface normal — this is what turns a flat gradient
  // into the organic marbled streaks (ported verbatim from twistedFieldNormal).
  float3 objectNormal = twistedFieldNormal(direction);
  float3 normal = normalize(animatedOrientation(objectNormal, rotationTime));

  float3 viewDirection = float3(0.0, 0.0, 1.0);
  float facing = max(dot(normal, viewDirection), 0.0);

  // gradientMethod == 2 (Facing): color coordinate is purely the fresnel term.
  float t = clamp(1.0 - facing, 0.0, 1.0);
  float4 baseColor = gradientAt(t);

  // material == 2 (Glossy) lighting branch, ported verbatim (constants
  // included) — the other material branches in the WGSL are dead code here.
  float3 keyDirection = normalize(float3(-0.45, 0.7, 0.65));
  float3 fillDirection = normalize(float3(0.5, -0.3, 0.4));
  float3 halfDirection = normalize(keyDirection + viewDirection);

  float key = max(dot(normal, keyDirection), 0.0);
  float fill = max(dot(normal, fillDirection), 0.0) * 0.22;
  float highlight = max(dot(normal, halfDirection), 0.0);

  float specular = pow(highlight, 72.0) * 0.42;
  float rim = pow(1.0 - facing, 2.2) * 0.12;

  float3 diffuseColor = baseColor.rgb * (0.34 + (key + fill) * 0.60);
  float3 reflection = float3(specular + rim);
  float3 litColor = diffuseColor + reflection;
  float3 finalColor = mix(baseColor.rgb, litColor, 0.5);

  return half4(finalColor, baseColor.a);
}
`;

export type GradientStop = { position: number; color: { r: number; g: number; b: number; a: number } };

export type ShaderCardParams = {
  gradient: [GradientStop, GradientStop, GradientStop];
  intensity: number;
  rotationSpeed: number;
  /** Ported from the Figma panel's "Detail" slider. */
  detail: number;
  /** Ported from the Figma panel's "Flow" slider (the WGSL's `warp`). */
  warp: number;
  /** Ported from the Figma panel's "Twist" slider. */
  twist: number;
  /** Ported from the Figma panel's "Morph speed" slider. */
  morphSpeed: number;
};
