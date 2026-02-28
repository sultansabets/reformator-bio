import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { getMetricColorHex, METRIC_COLORS } from "@/lib/colors";

const VISUAL_SIZE = 320;
const PARTICLE_COUNT = 4000;
const ENERGY_MODE_SEC = 30;
const QUOTE_MODE_SEC = 10;

const QUOTES = [
  "Мы живем ту жизнь, на которую нам хватило смелости.",
  "Ты не сможешь изменить то, что готов оправдать.",
  "Все, что мы не меняем, мы выбираем.",
];

function hexToRgbNormalized(hex: string): [number, number, number] {
  const m = hex.slice(1).match(/.{2}/g);
  if (!m) return [0.22, 0.75, 0.49];
  return [
    parseInt(m[0], 16) / 255,
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
  ];
}

interface ParticleOrbProps {
  color: string;
}

function ParticleOrb({ color }: ParticleOrbProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const targetColor = useRef(new THREE.Color(color));
  const currentColor = useRef(new THREE.Color(color));

  const particles = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const opacities = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      
      const radius = 2.0 + (Math.random() - 0.5) * 0.3;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      sizes[i] = 0.015 + Math.random() * 0.025;
      opacities[i] = 0.3 + Math.random() * 0.7;
    }

    return { positions, sizes, opacities };
  }, []);

  useEffect(() => {
    targetColor.current.set(color);
  }, [color]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.08;
      pointsRef.current.rotation.x += delta * 0.02;
    }

    if (materialRef.current) {
      currentColor.current.lerp(targetColor.current, delta * 2);
      materialRef.current.color = currentColor.current;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.04}
        color={color}
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function GlowRing({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const targetColor = useRef(new THREE.Color(color));
  const currentColor = useRef(new THREE.Color(color));

  useEffect(() => {
    targetColor.current.set(color);
  }, [color]);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.05;
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      currentColor.current.lerp(targetColor.current, delta * 2);
      material.color = currentColor.current;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[2.1, 0.015, 16, 100]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

interface HealthOrbProps {
  score: number;
}

export default function HealthOrb({ score }: HealthOrbProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"energy" | "quote">("energy");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const displayScore = Math.round(Math.min(100, Math.max(0, score)));
  const color = useMemo(() => getMetricColorHex(score), [score]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      if (tick === ENERGY_MODE_SEC) {
        setMode("quote");
      } else if (tick >= ENERGY_MODE_SEC + QUOTE_MODE_SEC) {
        tick = 0;
        setQuoteIndex((i) => (i + 1) % QUOTES.length);
        setMode("energy");
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex h-[300px] w-[340px] items-center justify-center overflow-visible">
      <div className="relative flex h-[320px] w-[320px] shrink-0 items-center justify-center">
        {/* WebGL Canvas */}
        <div
          className="absolute inset-0"
          style={{ width: VISUAL_SIZE, height: VISUAL_SIZE }}
        >
          <Canvas
            camera={{ position: [0, 0, 5], fov: 45 }}
            style={{ background: "transparent" }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.5} />
            <ParticleOrb color={color} />
            <GlowRing color={color} />
          </Canvas>
        </div>

        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center pointer-events-none overflow-hidden">
          <AnimatePresence mode="wait">
            {mode === "energy" ? (
              <motion.div
                key="energy"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center"
              >
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("metrics.state")}
                </span>
                <span className="mt-2 text-5xl font-bold tracking-tight text-foreground">
                  {displayScore}%
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="quote"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative flex items-center justify-center"
              >
                <div className="absolute inset-[20%] rounded-full bg-black/[0.04]" aria-hidden />
                <p className="relative max-w-[80%] text-center text-sm font-normal leading-relaxed text-foreground/75">
                  «{QUOTES[quoteIndex]}»
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
