import React, { useRef, useMemo, useEffect, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";

/** State colors for orb – premium health-tech palette */
const ORB_STATE_COLORS = {
  good: "#63C38D",  // score ≥ 80
  okay: "#6F6F6F",  // score 50–79
  bad: "#E14B42",   // score < 50
} as const;

function getOrbColor(score: number): string {
  if (score >= 80) return ORB_STATE_COLORS.good;
  if (score >= 50) return ORB_STATE_COLORS.okay;
  return ORB_STATE_COLORS.bad;
}

const PARTICLE_COUNT = 2500;
const BREATH_PERIOD = 6;
const BREATH_AMPLITUDE = 0.02;
const ROTATION_SPEED = 0.015;

const particleVertexShader = `
  attribute float radiusNorm;
  attribute float phase;
  uniform float uTime;
  uniform float uSize;
  varying float vOpacity;

  void main() {
    vec3 pos = position;
    float drift = 0.012 * sin(uTime * 0.4 + phase) * radiusNorm;
    pos += normalize(pos) * drift;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    float dist = length(mvPos.xyz);
    gl_PointSize = uSize * (300.0 / dist) * (1.4 - 0.5 * radiusNorm);
    vOpacity = 0.95 - 0.5 * radiusNorm;
  }
`;

const particleFragmentShader = `
  uniform vec3 uColor;
  varying float vOpacity;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = 1.0 - smoothstep(0.5, 1.0, d);
    gl_FragColor = vec4(uColor, a * vOpacity);
  }
`;

interface ParticleSphereProps {
  color: string;
  stateScore: number;
}

const ParticleSphere = memo(function ParticleSphere({
  color,
  stateScore,
}: ParticleSphereProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetColor = useRef(new THREE.Color(color));
  const currentColor = useRef(new THREE.Color(color));

  const geometry = useMemo(() => {
    const simplex = createNoise3D();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const radiusNorms = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    const baseRadius = 1;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Radial density: ~3x denser near center (bias radius toward 0)
      const rT = Math.pow(Math.random(), 2);
      let rBase = 0.35 + 0.65 * rT;

      const ux = Math.sin(phi) * Math.cos(theta);
      const uy = Math.sin(phi) * Math.sin(theta);
      const uz = Math.cos(phi);

      const noise = simplex(ux * 1.5, uy * 1.5, uz * 1.5);
      rBase += noise * 0.04;
      rBase = Math.max(0.2, Math.min(1, rBase));

      const radius = baseRadius * rBase;
      const x = radius * ux;
      const y = radius * uy;
      const z = radius * uz;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      radiusNorms[i] = rBase;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("radiusNorm", new THREE.BufferAttribute(radiusNorms, 1));
    geo.setAttribute("phase", new THREE.BufferAttribute(phases, 1));
    return geo;
  }, []);

  useEffect(() => {
    targetColor.current.set(color);
  }, [color]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pointsRef.current) {
      pointsRef.current.rotation.y += state.clock.getDelta() * 60 * ROTATION_SPEED;
      const breathing = 1 + Math.sin((t * Math.PI * 2) / BREATH_PERIOD) * BREATH_AMPLITUDE;
      const scoreScale = 1 + stateScore * 0.005;
      pointsRef.current.scale.setScalar(breathing * scoreScale);
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
      currentColor.current.lerp(targetColor.current, 0.02);
      materialRef.current.uniforms.uColor.value.copy(currentColor.current);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uSize: { value: 0.04 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});

const GlowSphere = memo(function GlowSphere({
  color,
  stateScore,
}: {
  color: string;
  stateScore: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      const breathing = 1 + Math.sin((t * Math.PI * 2) / BREATH_PERIOD) * BREATH_AMPLITUDE;
      const s = 1.15 * breathing * (1 + stateScore * 0.005);
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.2}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
});

interface StateOrb3DProps {
  score: number;
}

function StateOrb3D({ score }: StateOrb3DProps) {
  const color = useMemo(() => getOrbColor(score), [score]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <GlowSphere color={color} stateScore={score} />
        <ParticleSphere color={color} stateScore={score} />
      </Canvas>
    </div>
  );
}

export default memo(StateOrb3D);
