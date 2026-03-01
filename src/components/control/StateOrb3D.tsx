import React, { useRef, useMemo, useEffect, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { getMetricColorHex } from "@/lib/colors";

const PARTICLE_COUNT = 3200;
const OUTER_RADIUS = 1.55;
const LERP_SPEED = 3.0;

interface ParticleSphereProps {
  color: string;
}

const ParticleSphere = memo(function ParticleSphere({ color }: ParticleSphereProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const targetColor = useRef(new THREE.Color(color));
  const currentColor = useRef(new THREE.Color(color));
  const time = useRef(0);
  const basePositions = useRef<Float32Array | null>(null);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) }
  }), []);

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = OUTER_RADIUS * Math.sqrt(Math.random());
      
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      const z = 0;
      
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
      pointsRef.current.rotation.z += delta * 0.1;
      
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
          positions[i3 + 2] = 0;
        }
        geometry.attributes.position.needsUpdate = true;
      }
    }

    if (materialRef.current) {
      currentColor.current.lerp(targetColor.current, delta * LERP_SPEED);
      materialRef.current.uniforms.uColor.value.copy(currentColor.current);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        depthTest={true}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vPosition;
          void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 3.8;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying vec3 vPosition;

          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float d = length(coord);
            
            if (d > 0.5) discard;
            
            float pointMask = 1.0 - smoothstep(0.0, 0.5, d);
            
            float r = length(vPosition);
            float outerRadius = 1.55;
            
            float edgeBoost = smoothstep(outerRadius * 0.6, outerRadius, r);
            
            float alpha = pointMask * (0.6 + edgeBoost * 0.6);
            
            gl_FragColor = vec4(uColor, alpha);
          }
        `}
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
