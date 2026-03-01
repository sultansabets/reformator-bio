import React, { useRef, useMemo, useEffect, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { getMetricColorHex } from "@/lib/colors";

const PARTICLE_COUNT = 4000;
const OUTER_RADIUS = 1.55;
const INNER_RADIUS = OUTER_RADIUS * 0.5;
const LERP_SPEED = 3.0;

interface ParticleSphereProps {
  color: string;
}

const ParticleSphere = memo(function ParticleSphere({ color }: ParticleSphereProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  
  const targetColor = useRef(new THREE.Color(color));
  const currentColor = useRef(new THREE.Color(color));
  const time = useRef(0);
  const basePositions = useRef<Float32Array | null>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      
      const r = INNER_RADIUS + Math.random() * (OUTER_RADIUS - INNER_RADIUS);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    basePositions.current = positions.slice();
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useEffect(() => {
    targetColor.current.set(color);
  }, [color]);

  useFrame((_, delta) => {
    time.current += delta;
    
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.1;
      
      const pulse = 1 + Math.sin(time.current * 1.5) * 0.02;
      pointsRef.current.scale.setScalar(pulse);
      
      const positions = geometry.attributes.position.array as Float32Array;
      const base = basePositions.current;
      
      if (base) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          const noise = Math.sin(time.current * 2 + i * 0.01) * 0.015;
          
          positions[i3] = base[i3] * (1 + noise);
          positions[i3 + 1] = base[i3 + 1] * (1 + noise);
          positions[i3 + 2] = base[i3 + 2] * (1 + noise);
        }
        geometry.attributes.position.needsUpdate = true;
      }
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
        size={0.038}
        color={color}
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={true}
      />
    </points>
  );
});

interface StateOrb3DProps {
  score: number;
}

function StateOrb3D({ score }: StateOrb3DProps) {
  const color = useMemo(() => getMetricColorHex(score), [score]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <ParticleSphere color={color} />
      </Canvas>
    </div>
  );
}

export default memo(StateOrb3D);
