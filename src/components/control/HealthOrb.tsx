import React, { useRef, useEffect, useMemo } from "react";

const SIZE = 250;
const PARTICLE_COUNT = 120;
const BASE_RADIUS = SIZE / 2 - 3;
const MOUNT_DURATION_MS = 2000;
const CORE_RADIUS_RATIO = 0.35;
const LIQUID_CYCLE_MS = 8000;

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
  radius: number;
  angle: number;
  speed: number;
  size: number;
  opacity: number;
  maxOpacity: number;
}

function createParticle(center: number): Particle {
  const coreR = BASE_RADIUS * CORE_RADIUS_RATIO;
  const bandWidth = BASE_RADIUS * 0.15;
  const r = coreR + Math.random() * bandWidth;
  const angle = Math.random() * Math.PI * 2;
  return {
    x: center + Math.cos(angle) * r,
    y: center + Math.sin(angle) * r,
    radius: r,
    angle,
    speed: 0.12 + Math.random() * 0.1,
    size: 2 + Math.random() * 3,
    opacity: 0,
    maxOpacity: 0.3 + Math.random() * 0.7,
  };
}

function updateParticle(p: Particle, center: number, mountProgress: number) {
  const coreR = BASE_RADIUS * CORE_RADIUS_RATIO;
  const edgeR = BASE_RADIUS * 0.92;
  const fadeStartR = BASE_RADIUS * 0.78;

  p.radius += p.speed;
  p.x = center + Math.cos(p.angle) * p.radius;
  p.y = center + Math.sin(p.angle) * p.radius;

  if (p.radius > edgeR) {
    p.radius = coreR + Math.random() * BASE_RADIUS * 0.12;
    p.angle = Math.random() * Math.PI * 2;
    p.x = center + Math.cos(p.angle) * p.radius;
    p.y = center + Math.sin(p.angle) * p.radius;
  }

  if (mountProgress < 1) {
    p.opacity = p.maxOpacity * mountProgress * mountProgress;
  } else if (p.radius > fadeStartR) {
    p.opacity = p.maxOpacity * (1 - (p.radius - fadeStartR) / (edgeR - fadeStartR));
  } else {
    p.opacity = p.maxOpacity;
  }
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
  const reducedMotionRef = useRef(false);

  const color = useMemo(() => getColorFromScore(score), [score]);
  colorRef.current = color;
  const [cr, cg, cb] = useMemo(() => hexToRgb(color), [color]);
  const displayScore = Math.round(Math.min(100, Math.max(0, score)));

  useEffect(() => {
    reducedMotionRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const getDynamicRadius = (angle: number, t: number) => {
      const phase = (t / LIQUID_CYCLE_MS) * Math.PI * 2;
      return (
        BASE_RADIUS +
        Math.sin(angle * 3 + phase) * 5 +
        Math.cos(angle * 2 - phase * 0.7) * 4
      );
    };

    const draw = (timestamp: number) => {
      if (mountStartRef.current == null) mountStartRef.current = timestamp;
      const elapsed = timestamp - mountStartRef.current;
      const mountProgress = Math.min(1, elapsed / MOUNT_DURATION_MS);
      const easeOut = 1 - Math.pow(1 - mountProgress, 1.3);

      if (!reducedMotionRef.current) {
        timeRef.current = elapsed * 0.001;
        rotationRef.current += 0.0015;
      }

      const hex = colorRef.current;
      const [r, g, b] = hexToRgb(hex);
      const time = timeRef.current;
      const rot = rotationRef.current;

      ctx.clearRect(0, 0, SIZE, SIZE);

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(rot);
      ctx.translate(-center, -center);

      const pathPoints: [number, number][] = [];
      for (let i = 0; i <= 96; i++) {
        const angle = (i / 96) * Math.PI * 2;
        const dynamicRadius = getDynamicRadius(angle, elapsed);
        const px = center + Math.cos(angle) * Math.max(2, dynamicRadius * easeOut);
        const py = center + Math.sin(angle) * Math.max(2, dynamicRadius * easeOut);
        pathPoints.push([px, py]);
      }

      ctx.beginPath();
      pathPoints.forEach(([px, py], i) => {
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.clip();

      ctx.beginPath();
      pathPoints.forEach(([px, py], i) => {
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.4 * easeOut})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      if (particles.length > 0) {
        const colorBase = `rgba(${r}, ${g}, ${b}, `;
        const coreRadius = BASE_RADIUS * CORE_RADIUS_RATIO;

        for (const p of particles) {
          if (!reducedMotionRef.current) {
            updateParticle(p, center, mountProgress);
          } else {
            p.opacity = p.maxOpacity * 0.6;
          }
          const dx = p.x - center;
          const dy = p.y - center;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > coreRadius) {
            ctx.save();
            ctx.shadowBlur = p.size * 2;
            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.5})`;
            ctx.fillStyle = colorBase + p.opacity + ")";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
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
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 35%)`,
          boxShadow: `0 0 70px rgba(${cr},${cg},${cb},0.5), 0 0 140px rgba(${cr},${cg},${cb},0.3), inset 0 0 35px rgba(${cr},${cg},${cb},0.2)`,
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
