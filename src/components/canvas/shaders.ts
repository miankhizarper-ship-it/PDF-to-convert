/**
 * GLSL for the orbital hero.
 *
 * Deliberately derivative-free (no `fwidth`) so the shaders compile on both
 * WebGL2 and older WebGL1 contexts — a compile error here would blank the hero.
 */

/* ── Holographic latitude/longitude globe ─────────────────────── */

export const holoVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vObjectPosition;

  void main() {
    vObjectPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = mvPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const holoFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uOpacity;
  uniform float uEnergy;
  uniform vec3 uColorA;   // neon lime
  uniform vec3 uColorB;   // electric green
  uniform vec3 uColorC;   // electric purple

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vObjectPosition;

  const float PI = 3.141592653589793;

  // Crisp-ish line mask without screen-space derivatives: the line widens
  // towards grazing angles, which hides most aliasing on a curved surface.
  float lineMask(float coord, float cells, float baseWidth, float grazing) {
    float f = fract(coord * cells);
    float dist = min(f, 1.0 - f);
    float width = baseWidth * (0.65 + grazing * 1.35);
    return 1.0 - smoothstep(width, width * 2.6 + 0.004, dist);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vViewPosition);
    float facing = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.6);
    float grazing = 1.0 - facing;

    // Spherical coordinates from the object-space position, so the grid
    // rotates together with the mesh.
    vec3 p = normalize(vObjectPosition);
    float lat = (asin(clamp(p.y, -1.0, 1.0)) / PI) + 0.5;
    float lon = (atan(p.z, p.x) / (2.0 * PI)) + 0.5;

    float grid = 0.0;
    grid += lineMask(lat, 13.0, 0.030, grazing) * 0.9;
    grid += lineMask(lon, 24.0, 0.022, grazing) * 0.75;
    grid = clamp(grid, 0.0, 1.0);

    // Emphasised equator + prime meridian
    float equator = lineMask(lat, 1.0, 0.0035, grazing);
    float meridian = lineMask(lon, 2.0, 0.0030, grazing);

    // Slow scan band travelling from south to north
    float sweep = fract(uTime * 0.055);
    float bandDistance = abs(lat - sweep);
    float band = exp(-bandDistance * 26.0);

    // Second, faster pulse for a "live system" feel
    float pulse = fract(uTime * 0.16 + 0.4);
    float pulseDistance = abs(lat - pulse);
    float spark = exp(-pulseDistance * 90.0) * 0.5;

    vec3 color = mix(uColorA, uColorB, clamp(grid + band * 0.6, 0.0, 1.0));
    color = mix(color, uColorC, fresnel * 0.85);
    color += uColorB * (band * 0.55 + spark * 0.4);

    float alpha = 0.0;
    alpha += grid * (0.34 + uEnergy * 0.16);
    alpha += fresnel * 0.42;
    alpha += equator * 0.55;
    alpha += meridian * 0.35;
    alpha += band * 0.30 + spark * 0.18;
    alpha *= uOpacity;

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

/* ── Floating particle field ──────────────────────────────────── */

export const particleVertexShader = /* glsl */ `
  attribute float aScale;
  attribute float aSeed;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uOpacity;
  uniform float uDrift;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    float seed = aSeed * 6.2831853;
    float t = uTime * 0.22 + seed;

    pos.x += sin(t) * uDrift;
    pos.y += cos(t * 0.83) * uDrift * 1.25;
    pos.z += sin(t * 0.61) * uDrift;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float depth = max(0.35, -mvPosition.z);

    gl_Position = projectionMatrix * mvPosition;

    float twinkle = 0.55 + 0.45 * sin(uTime * 1.45 + aSeed * 24.0);
    gl_PointSize = uSize * aScale * uPixelRatio * twinkle * (9.0 / depth);

    vColor = aColor;
    // Fade distant particles so the field reads as depth, not noise.
    vAlpha = twinkle * smoothstep(30.0, 5.0, depth) * uOpacity;
  }
`;

export const particleFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;

    float core = smoothstep(0.5, 0.04, dist);
    float halo = smoothstep(0.5, 0.0, dist) * 0.28;
    float alpha = (core + halo) * vAlpha;

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

/* ── Additive core glow ───────────────────────────────────────── */

export const coreVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = mvPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const coreFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vViewPosition);
    float rim = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 1.7);
    float breathe = 0.82 + 0.18 * sin(uTime * 1.1);
    float alpha = rim * uOpacity * breathe;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor * (0.6 + rim), alpha);
  }
`;
