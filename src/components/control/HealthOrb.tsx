import React, { useRef, useEffect, useMemo } from "react";

const SIZE = 250;
const PARTICLE_COUNT = 300;
const MAX_TILT_PX = 10;
const TILT_LERP = 0.08;

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
}

function createParticles(): Particle[] {
  const particles: Particle[] = [];
  const center = SIZE / 2;
  const maxR = center - 8;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * maxR;
    particles.push({
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      radius: 1 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.5,
    });
  }
  return particles;
}

interface HealthOrbProps {
  score: number;
}

export default function HealthOrb({ score }: HealthOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const colorRef = useRef<string>("#34c759");
  const tiltTargetRef = useRef({ x: 0, y: 0 });
  const tiltCurrentRef = useRef({ x: 0, y: 0 });

  const color = useMemo(() => getColorFromScore(score), [score]);
  colorRef.current = color;
  const [cr, cg, cb] = useMemo(() => hexToRgb(color), [color]);
  const displayScore = Math.round(Math.min(100, Math.max(0, score)));

  useEffect(() => {
    if (!particlesRef.current) {
      particlesRef.current = createParticles();
    }
    const particles = particlesRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = SIZE;
    canvas.height = SIZE;

    const center = SIZE / 2;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      const scale = MAX_TILT_PX / 45;
      tiltTargetRef.current = {
        x: Math.max(-MAX_TILT_PX, Math.min(MAX_TILT_PX, gamma * scale)),
        y: Math.max(-MAX_TILT_PX, Math.min(MAX_TILT_PX, (beta - 45) * scale)),
      };
    };

    if (typeof window !== "undefined" && typeof DeviceOrientationEvent !== "undefined") {
      const DevO = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DevO.requestPermission === "function") {
        DevO.requestPermission()
          .then(() => window.addEventListener("deviceorientation", handleOrientation))
          .catch(() => {});
      } else {
        window.addEventListener("deviceorientation", handleOrientation);
      }
    }

    const draw = () => {
      const hex = colorRef.current;
      const [cr, cg, cb] = hexToRgb(hex);

      const t = tiltCurrentRef.current;
      const target = tiltTargetRef.current;
      t.x += (target.x - t.x) * TILT_LERP;
      t.y += (target.y - t.y) * TILT_LERP;

      ctx.clearRect(0, 0, SIZE, SIZE);

      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, center - 1, 0, Math.PI * 2);
      ctx.clip();

      const g = ctx.createRadialGradient(
        center + t.x,
        center + t.y,
        0,
        center + t.x,
        center + t.y,
        center
      );
      g.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.2)`);
      g.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, 0.06)`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SIZE, SIZE);

      const colorBase = `rgba(${cr}, ${cg}, ${cb}, `;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > SIZE) p.vx *= -1;
        if (p.y < 0 || p.y > SIZE) p.vy *= -1;
        p.x = Math.max(0, Math.min(SIZE, p.x));
        p.y = Math.max(0, Math.min(SIZE, p.y));

        ctx.beginPath();
        ctx.arc(p.x + t.x, p.y + t.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = colorBase + p.opacity + ")";
        ctx.fill();
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  return (
    <div className="relative flex h-[250px] w-[250px] items-center justify-center overflow-hidden rounded-full">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(ellipse at center, rgba(${cr},${cg},${cb},0.25) 0%, rgba(${cr},${cg},${cb},0.08) 50%, transparent 70%)`,
          boxShadow: `0 0 48px rgba(${cr},${cg},${cb},0.35), inset 0 0 40px rgba(${cr},${cg},${cb},0.06)`,
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
