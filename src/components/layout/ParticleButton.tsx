import React, { useRef, useEffect } from "react";

interface ParticleButtonProps {
  size?: number;
}

const PARTICLE_COUNT = 10;
const GREEN_COLOR = "#34c759";

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

export function ParticleButton({ size = 40 }: ParticleButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const center = size / 2;
  const radius = size * 0.38;

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

      for (const p of particles) {
        p.x += p.vx * (delta * 0.04);
        p.y += p.vy * (delta * 0.04);

        const dx = p.x - center;
        const dy = p.y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > radius) {
          const nx = dx / dist;
          const ny = dy / dist;
          p.x = center + nx * radius;
          p.y = center + ny * radius;
          p.vx = -p.vx * 0.7 + (Math.random() - 0.5) * 0.1;
          p.vy = -p.vy * 0.7 + (Math.random() - 0.5) * 0.1;
        }

        if (Math.random() < 0.008) {
          p.vx += (Math.random() - 0.5) * 0.1;
          p.vy += (Math.random() - 0.5) * 0.1;
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.4) {
          p.vx *= 0.92;
          p.vy *= 0.92;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, 0.85)`;
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
      className="pointer-events-none"
      style={{ width: size, height: size }}
    />
  );
}
