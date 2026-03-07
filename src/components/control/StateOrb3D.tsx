import React, { useRef, useMemo, useEffect, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";

/** State colors for orb (green / gray / red) */
const ORB_STATE_COLORS = {
  good: "#63C38D",
  okay: "#6F6F6F",
  bad: "#E14B42",
} as const;

function getOrbColor(score: number): string {
  if (score >= 80) return ORB_STATE_COLORS.good;
  if (score >= 50) return ORB_STATE_COLORS.okay;
  return ORB_STATE_COLORS.bad;
}

const PARTICLE_COUNT = 10000;
const LERP_SPEED = 3.0;

interface ParticleSphereProps {
  color: string;
  recoveryScore: number;
}

const ParticleSphere = memo(function ParticleSphere({
  color,
  recoveryScore,
}: ParticleSphereProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const targetColor = useRef(new THREE.Color(color));
  const currentColor = useRef(new THREE.Color(color));

  const geometry = useMemo(() => {
    const simplex = createNoise3D();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const baseRadius = 1;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const rn = Math.random();
      let rBase: number;
      let distortion: number;
      if (rn < 0.15) {
        rBase = 0.7 + Math.random() * 0.1;
        distortion = 0.04;
      } else if (rn < 0.75) {
        rBase = 0.8 + Math.random() * 0.15;
        distortion = 0.06;
      } else {
        rBase = 0.95 + Math.random() * 0.05;
        distortion = 0.1;
      }

      let radius = baseRadius * rBase;

      const ux = Math.sin(phi) * Math.cos(theta);
      const uy = Math.sin(phi) * Math.sin(theta);
      const uz = Math.cos(phi);

      const noise = simplex(ux * 2, uy * 2, uz * 2);
      radius += noise * distortion;

      positions[i * 3] = radius * ux;
      positions[i * 3 + 1] = radius * uy;
      positions[i * 3 + 2] = radius * uz;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useEffect(() => {
    targetColor.current.set(color);
  }, [color]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.08;
      const breathing = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
      const radiusScale = 1 + recoveryScore * 0.01;
      pointsRef.current.scale.setScalar(breathing * radiusScale);
    }
    if (materialRef.current) {
      currentColor.current.lerp(targetColor.current, delta * LERP_SPEED);
      materialRef.current.color.copy(currentColor.current);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={0.015}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color={color}
        sizeAttenuation
      />
    </points>
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
        <ParticleSphere color={color} recoveryScore={score} />
      </Canvas>
    </div>
  );
}

export default memo(StateOrb3D);
