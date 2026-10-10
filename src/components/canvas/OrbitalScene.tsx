"use client";

import { useMemo, useRef, type Ref } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isLowPowerDevice } from "@/lib/gl";
import { pointerState, scrollState } from "@/lib/scroll-bus";
import { clamp, seededRandom } from "@/lib/utils";
import {
  coreFragmentShader,
  coreVertexShader,
  holoFragmentShader,
  holoVertexShader,
  particleFragmentShader,
  particleVertexShader,
} from "./shaders";

const ACID = new THREE.Color("#D9FF63");
const VOLT = new THREE.Color("#39FF88");
const IRIS = new THREE.Color("#A855F7");

type SharedUniforms = {
  uTime: { value: number };
  uOpacity: { value: number };
  uEnergy: { value: number };
  uPixelRatio: { value: number };
};

type SceneProps = { calm: boolean };

/**
 * The orbital system: holographic wireframe globe, faceted shell, glowing core,
 * three tilted orbital rings with satellites, and a drifting particle field.
 * Pointer + scroll values are read from the frame bus (never React state).
 */
export function OrbitalScene({ calm }: SceneProps) {
  const rigRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);

  const shared = useMemo<SharedUniforms>(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uEnergy: { value: 0 },
      uPixelRatio: { value: 1 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const rig = rigRef.current;
    if (!rig) return;

    const pixelRatio = state.gl.getPixelRatio();
    if (Math.abs(shared.uPixelRatio.value - pixelRatio) > 0.01) shared.uPixelRatio.value = pixelRatio;

    if (calm) {
      shared.uTime.value = 0;
      shared.uOpacity.value = 1;
      rig.position.set(0, 0, 0);
      rig.scale.setScalar(1);
      return;
    }

    const step = Math.min(delta, 0.05);
    shared.uTime.value = state.clock.elapsedTime;

    /* Scroll-linked transformation: rise, shrink, tilt, fade out of the hero. */
    const progress = clamp(scrollState.heroProgress, 0, 1);
    shared.uOpacity.value = 1 - progress * 0.9;
    shared.uEnergy.value = progress;

    rig.position.y = progress * 1.9;
    rig.position.z = -progress * 2.4;
    rig.scale.setScalar(1 - progress * 0.22);
    rig.rotation.z = progress * 0.28;

    /* Mouse-responsive 3D movement, damped for a weighty feel. */
    const targetY = pointerState.nx * 0.5 + state.clock.elapsedTime * 0.035;
    const targetX = -pointerState.ny * 0.34;
    rig.rotation.y = THREE.MathUtils.damp(rig.rotation.y, targetY, 2.4, step);
    rig.rotation.x = THREE.MathUtils.damp(rig.rotation.x, targetX, 2.4, step);

    if (spinRef.current) spinRef.current.rotation.y += step * 0.085;
    if (shellRef.current) {
      shellRef.current.rotation.y -= step * 0.045;
      shellRef.current.rotation.x += step * 0.018;
    }
  });

  return (
    <group ref={rigRef}>
      <group ref={spinRef}>
        <HoloGlobe shared={shared} />
        <CoreGlow shared={shared} />
      </group>

      <WireShell ref={shellRef} />
      <OrbitalRings calm={calm} />
      <HorizonDisc />
      <ParticleField shared={shared} calm={calm} />
    </group>
  );
}

/* ── holographic globe ────────────────────────────────────────── */

function HoloGlobe({ shared }: { shared: SharedUniforms }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: shared.uTime,
          uOpacity: shared.uOpacity,
          uEnergy: shared.uEnergy,
          uColorA: { value: ACID },
          uColorB: { value: VOLT },
          uColorC: { value: IRIS },
        },
        vertexShader: holoVertexShader,
        fragmentShader: holoFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [shared],
  );

  return (
    <mesh>
      <sphereGeometry args={[2, 96, 96]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/* ── faceted wireframe shell ──────────────────────────────────── */

type WireShellProps = { ref?: Ref<THREE.Mesh> };

function WireShell({ ref }: WireShellProps) {
  return (
    <mesh ref={ref} scale={1.16}>
      <icosahedronGeometry args={[2, 3]} />
      <meshBasicMaterial color={IRIS} wireframe transparent opacity={0.11} depthWrite={false} />
    </mesh>
  );
}

/* ── additive core ────────────────────────────────────────────── */

function CoreGlow({ shared }: { shared: SharedUniforms }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: shared.uTime,
          uOpacity: { value: 0.85 },
          uColor: { value: VOLT },
        },
        vertexShader: coreVertexShader,
        fragmentShader: coreFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [shared],
  );

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshBasicMaterial color={VOLT} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh scale={1.9}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}

/* ── orbital rings + satellites ───────────────────────────────── */

type RingSpec = {
  radius: number;
  tilt: [number, number, number];
  color: THREE.Color;
  opacity: number;
  speed: number;
  satellite: number;
};

const RINGS: RingSpec[] = [
  { radius: 3.05, tilt: [Math.PI / 2.15, 0.22, 0.1], color: ACID, opacity: 0.55, speed: 0.22, satellite: 0.055 },
  { radius: 3.75, tilt: [Math.PI / 1.75, -0.45, -0.18], color: IRIS, opacity: 0.42, speed: -0.16, satellite: 0.045 },
  { radius: 4.5, tilt: [Math.PI / 2.6, 0.62, 0.32], color: VOLT, opacity: 0.3, speed: 0.11, satellite: 0.04 },
];

function OrbitalRings({ calm }: { calm: boolean }) {
  const orbitRefs = useRef<Array<THREE.Group | null>>([]);

  useFrame((_, delta) => {
    if (calm) return;
    const step = Math.min(delta, 0.05);
    RINGS.forEach((ring, index) => {
      const node = orbitRefs.current[index];
      if (node) node.rotation.y += step * ring.speed;
    });
  });

  return (
    <group>
      {RINGS.map((ring, index) => (
        <group key={ring.radius} rotation={ring.tilt}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ring.radius, 0.0055, 4, 260]} />
            <meshBasicMaterial
              color={ring.color}
              transparent
              opacity={ring.opacity}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          <group
            ref={(node) => {
              orbitRefs.current[index] = node;
            }}
          >
            <mesh position={[ring.radius, 0, 0]}>
              <octahedronGeometry args={[ring.satellite, 0]} />
              <meshBasicMaterial color={ring.color} toneMapped={false} />
            </mesh>
            <mesh position={[ring.radius, 0, 0]} scale={2.6}>
              <octahedronGeometry args={[ring.satellite, 0]} />
              <meshBasicMaterial color={ring.color} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[-ring.radius * 0.82, 0, ring.radius * 0.57]}>
              <sphereGeometry args={[ring.satellite * 0.55, 12, 12]} />
              <meshBasicMaterial color={ACID} transparent opacity={0.8} toneMapped={false} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

/* ── horizon disc (depth cue) ─────────────────────────────────── */

function HorizonDisc() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -2.6, 0]}>
      <ringGeometry args={[4.2, 6.6, 96, 1]} />
      <meshBasicMaterial
        color={IRIS}
        transparent
        opacity={0.07}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ── particle field ───────────────────────────────────────────── */

function ParticleField({ shared, calm }: { shared: SharedUniforms; calm: boolean }) {
  const geometry = useMemo(() => {
    const lowPower = isLowPowerDevice();
    const count = lowPower ? 620 : 1500;
    const random = seededRandom(20260110);

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const palette = [ACID, VOLT, IRIS, IRIS, ACID];

    for (let i = 0; i < count; i += 1) {
      // Shell around the planet plus a wider ambient field for depth.
      const near = i % 4 !== 0;
      const radius = near ? 3.1 + random() * 4.4 : 8.5 + random() * 11;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.72;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      scales[i] = 0.35 + random() * 1.5;
      seeds[i] = random();

      const color = palette[Math.floor(random() * palette.length)] ?? ACID;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: shared.uTime,
          uOpacity: { value: 1 },
          uSize: { value: 16 },
          uDrift: { value: 0.22 },
          uPixelRatio: shared.uPixelRatio,
        },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [shared],
  );

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (calm || !pointsRef.current) return;
    pointsRef.current.rotation.y += Math.min(delta, 0.05) * 0.012;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </points>
  );
}
