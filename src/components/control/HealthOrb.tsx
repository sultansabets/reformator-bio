import React, { useRef, useEffect, useMemo } from "react";

const SIZE = 250;
const PARTICLE_COUNT = 150;
const BASE_RADIUS = SIZE / 2 - 2;
const PARTICLE_SPEED = 0.25;
const RESPAWN_RADIUS_RATIO = 0.9;
const MOUNT_DURATION_MS = 2600;
const CENTER_CLEAR_RADIUS = BASE_RADIUS * 0.3;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.slice(1).match(/.{2}/g);
  if (!m) return [255, 59, 48];
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}

function getColorFromScore(score: number): string {
  const s = Math.min(100, Math.max(0, score));
  if (s >= 70) return "#34c759";
  if (s >= 40) return "#ff9f0a";
  return "#ff3b30";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  maxOpacity: number;
}

function createParticle(center: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = PARTICLE_SPEED * (0.6 + Math.random() * 0.8);
  return {
    x: center,
    y: center,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 2 + Math.random() * 3,
    opacity: 0,
    maxOpacity: 0.4 + Math.random() * 0.35,
  };
}

function respawnParticle(p: Particle, center: number) {
  const angle = Math.random() * Math.PI * 2;
  const speed = PARTICLE_SPEED * (0.6 + Math.random() * 0.8);
  p.x = center;
  p.y = center;
  p.vx = Math.cos(angle) * speed;
  p.vy = Math.sin(angle) * speed;
  p.opacity = 0;
  p.maxOpacity = 0.4 + Math.random() * 0.35;
}

interface HealthOrbProps {
  score: number;
}

export default function HealthOrb({ score }: HealthOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const colorRef = useRef<string>("#34c759");
  const timeRef = useRef(0);
  const mountStartRef = useRef<number | null>(null);
  const rotationRef = useRef(0);

  const color = useMemo(() => getColorFromScore(score), [score]);
  colorRef.current = color;
  const [cr, cg, cb] = useMemo(() => hexToRgb(color), [color]);
  const displayScore = Math.round(Math.min(100, Math.max(0, score)));

  useEffect(() => {
    const center = SIZE / 2;
    if (!particlesRef.current) {
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => createParticle(center));
    }
    const particles = particlesRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = SIZE;
    canvas.height = SIZE;

    const draw = (timestamp: number) => {
      if (mountStartRef.current == null) mountStartRef.current = timestamp;
      const elapsed = timestamp - mountStartRef.current;
      const mountProgress = Math.min(1, elapsed / MOUNT_DURATION_MS);
      const easeOut = 1 - Math.pow(1 - mountProgress, 1.2);

      timeRef.current += 0.014;
      rotationRef.current += 0.0018;

      const hex = colorRef.current;
      const [r, g, b] = hexToRgb(hex);
      const time = timeRef.current;
      const rot = rotationRef.current;

      ctx.clearRect(0, 0, SIZE, SIZE);

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(rot);
      ctx.translate(-center, -center);

      const getDynamicRadius = (angle: number) =>
        BASE_RADIUS +
        Math.sin(angle * 3 + time) * 8 +
        Math.cos(angle * 2 - time * 0.8) * 5;

      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const angle = (i / 80) * Math.PI * 2;
        const dynamicRadius = getDynamicRadius(angle) * easeOut;
        const px = center + Math.cos(angle) * Math.max(1, dynamicRadius);
        const py = center + Math.sin(angle) * Math.max(1, dynamicRadius);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();

      const innerGlow = ctx.createRadialGradient(center, center, 0, center, center, BASE_RADIUS);
      innerGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.08)`);
      innerGlow.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.04)`);
      innerGlow.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, 0.02)`);
      innerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = innerGlow;
      ctx.fillRect(0, 0, SIZE, SIZE);

      const glassHighlight = ctx.createRadialGradient(center, center, BASE_RADIUS * 0.6, center, center, BASE_RADIUS + 10);
      glassHighlight.addColorStop(0, "rgba(255, 255, 255, 0)");
      glassHighlight.addColorStop(0.85, "rgba(255, 255, 255, 0)");
      glassHighlight.addColorStop(0.95, `rgba(255, 255, 255, ${0.12 * easeOut})`);
      glassHighlight.addColorStop(1, `rgba(255, 255, 255, ${0.06 * easeOut})`);
      ctx.fillStyle = glassHighlight;
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const angle = (i / 80) * Math.PI * 2;
        const dynamicRadius = getDynamicRadius(angle) * easeOut;
        const px = center + Math.cos(angle) * Math.max(1, dynamicRadius);
        const py = center + Math.sin(angle) * Math.max(1, dynamicRadius);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * easeOut})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const colorBase = `rgba(${r}, ${g}, ${b}, `;
      const respawnR = BASE_RADIUS * RESPAWN_RADIUS_RATIO;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        const dx = p.x - center;
        const dy = p.y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > respawnR) {
          respawnParticle(p, center);
        } else if (dist < CENTER_CLEAR_RADIUS) {
          p.opacity = 0;
        } else {
          const fadeStart = respawnR * 0.72;
          if (dist > fadeStart) {
            p.opacity = p.maxOpacity * (1 - (dist - fadeStart) / (respawnR - fadeStart));
          } else {
            p.opacity = p.maxOpacity;
          }
        }

        if (dist > CENTER_CLEAR_RADIUS && dist < respawnR + 2) {
          ctx.save();
          ctx.shadowBlur = p.radius * 2;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.5})`;
          ctx.fillStyle = colorBase + Math.max(0, p.opacity) + ")";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative flex h-[250px] w-[250px] items-center justify-center overflow-hidden rounded-full">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(ellipse at center, rgba(${cr},${cg},${cb},0.2) 0%, rgba(${cr},${cg},${cb},0.05) 50%, transparent 80%)`,
          boxShadow: `0 0 52px rgba(${cr},${cg},${cb},0.35), inset 0 0 50px rgba(${cr},${cg},${cb},0.06)`,
        }}
      />
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="absolute left-0 top-0 rounded-full"
        style={{ width: SIZE, height: SIZE }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-5xl font-bold tracking-tight text-foreground">
          {displayScore}
        </span>
        <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Состояние
        </span>
        <span
          className="mt-1 text-sm font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          {score >= 70 ? "ВЫСОКОЕ" : score >= 40 ? "УМЕРЕННОЕ" : "НИЗКОЕ"}
        </span>
      </div>
    </div>
  );
}
