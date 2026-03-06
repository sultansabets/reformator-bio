import React, { useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const PARTICLE_COUNT = 12;
const DELTA_MULTIPLIER = 0.04;
const VELOCITY_DAMP = 0.7;
const VELOCITY_RANDOM = 0.1;
const VELOCITY_NUDGE_CHANCE = 0.008;
const SPEED_CAP = 0.4;
const SPEED_DAMP = 0.92;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

function createParticle(center: number, radius: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * radius * 0.7 + radius * 0.1;
  return {
    x: center + Math.cos(angle) * dist,
    y: center + Math.sin(angle) * dist,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    size: Math.random() * 1.2 + 0.8,
    opacity: Math.random() * 0.3 + 0.5,
  };
}

export interface ParticlesIconProps {
  size?: number;
  active?: boolean;
  /** Override color as "r, g, b" (e.g. "217, 255, 0" for green). When set, ignores active/theme. */
  colorRgb?: string;
  className?: string;
}

/**
 * Shared particle animation used in nav bar and AI page.
 * Inactive: muted color (matches other nav icons).
 * Active: white (#FCFCFC).
 */
const WHITE_RGB = "252, 252, 252";
const DARK_MUTED_RGB = "111, 111, 111";
const LIGHT_MUTED_RGB = "111, 111, 111";

export function ParticlesIcon({ size = 40, active = false, colorRgb, className }: ParticlesIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const colorRef = useRef<string>(DARK_MUTED_RGB);
  const { theme } = useTheme();

  const center = size / 2;
  const radius = size * 0.38;

  colorRef.current =
    colorRgb ??
    (active ? WHITE_RGB : theme === "dark" ? DARK_MUTED_RGB : LIGHT_MUTED_RGB);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    if (particlesRef.current.length === 0) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlesRef.current.push(createParticle(center, radius));
      }
    }

    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = Math.min(time - lastTime, 32);
      lastTime = time;

      ctx.clearRect(0, 0, size, size);

      const particles = particlesRef.current;
      const rgb = colorRef.current;

      for (const p of particles) {
        p.x += p.vx * (delta * DELTA_MULTIPLIER);
        p.y += p.vy * (delta * DELTA_MULTIPLIER);

        const dx = p.x - center;
        const dy = p.y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > radius) {
          const nx = dx / dist;
          const ny = dy / dist;
          p.x = center + nx * radius;
          p.y = center + ny * radius;
          p.vx = -p.vx * VELOCITY_DAMP + (Math.random() - 0.5) * VELOCITY_RANDOM;
          p.vy = -p.vy * VELOCITY_DAMP + (Math.random() - 0.5) * VELOCITY_RANDOM;
        }

        if (Math.random() < VELOCITY_NUDGE_CHANCE) {
          p.vx += (Math.random() - 0.5) * VELOCITY_RANDOM;
          p.vy += (Math.random() - 0.5) * VELOCITY_RANDOM;
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > SPEED_CAP) {
          p.vx *= SPEED_DAMP;
          p.vy *= SPEED_DAMP;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, 0.85)`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, center, radius]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
