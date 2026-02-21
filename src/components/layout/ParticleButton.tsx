import React, { useRef, useEffect } from "react";

interface ParticleButtonProps {
  size?: number;
  isActive?: boolean;
}

const PARTICLE_COUNT = 8;

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
  const dist = Math.random() * radius * 0.6 + radius * 0.2;
  return {
    x: center + Math.cos(angle) * dist,
    y: center + Math.sin(angle) * dist,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 1.5 + 1,
    opacity: Math.random() * 0.4 + 0.4,
  };
}

export function ParticleButton({ size = 40, isActive = false }: ParticleButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const center = size / 2;
  const radius = size * 0.35;

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
      const activeColor = isActive ? "rgba(34, 197, 94, " : "rgba(156, 163, 175, ";
      const glowColor = isActive ? "rgba(34, 197, 94, 0.3)" : "rgba(156, 163, 175, 0.2)";

      for (const p of particles) {
        p.x += p.vx * (delta * 0.05);
        p.y += p.vy * (delta * 0.05);

        const dx = p.x - center;
        const dy = p.y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > radius) {
          const nx = dx / dist;
          const ny = dy / dist;
          p.x = center + nx * radius;
          p.y = center + ny * radius;
          p.vx = -p.vx * 0.8 + (Math.random() - 0.5) * 0.2;
          p.vy = -p.vy * 0.8 + (Math.random() - 0.5) * 0.2;
        }

        if (Math.random() < 0.01) {
          p.vx += (Math.random() - 0.5) * 0.15;
          p.vy += (Math.random() - 0.5) * 0.15;
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.5) {
          p.vx *= 0.95;
          p.vy *= 0.95;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + 1, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = activeColor + (isActive ? p.opacity + 0.2 : p.opacity * 0.7) + ")";
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
  }, [size, isActive, center, radius]);

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
