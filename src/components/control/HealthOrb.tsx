import React, { useRef, useEffect, useMemo } from "react";

const SIZE = 250;
const PARTICLE_COUNT = 120;
const MAX_TILT_PX = 10;
const TILT_LERP = 0.08;
const BOUNDARY_DISTORTION = 6;
const BASE_RADIUS = SIZE / 2 - 1;
const CENTER_ZONE_RATIO = 0.4;
const RING_OUTER_RATIO = 0.95;
const MOUNT_DURATION_MS = 2500;

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
  const innerR = BASE_RADIUS * CENTER_ZONE_RATIO;
  const outerR = BASE_RADIUS * RING_OUTER_RATIO;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = innerR + Math.sqrt(Math.random()) * (outerR - innerR);
    particles.push({
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      radius: 3 + Math.random() * 3,
      opacity: 0.35 + Math.random() * 0.35,
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
  const timeRef = useRef(0);
  const mountStartRef = useRef<number | null>(null);
  const rotationRef = useRef(0);

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
    const innerRing = BASE_RADIUS * CENTER_ZONE_RATIO;

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

    const draw = (timestamp: number) => {
      if (mountStartRef.current == null) mountStartRef.current = timestamp;
      const elapsed = timestamp - mountStartRef.current;
      const mountProgress = Math.min(1, elapsed / MOUNT_DURATION_MS);
      const easeOut = 1 - Math.pow(1 - mountProgress, 1.5);

      timeRef.current += 0.012;
      rotationRef.current += 0.002;

      const hex = colorRef.current;
      const [r, g, b] = hexToRgb(hex);

      const t = tiltCurrentRef.current;
      const target = tiltTargetRef.current;
      t.x += (target.x - t.x) * TILT_LERP;
      t.y += (target.y - t.y) * TILT_LERP;

      ctx.clearRect(0, 0, SIZE, SIZE);

      const time = timeRef.current;
      const rot = rotationRef.current;
      const distortionAmount = BOUNDARY_DISTORTION * easeOut;

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(rot);
      ctx.translate(-center, -center);

      ctx.beginPath();
      for (let i = 0; i <= 72; i++) {
        const angle = (i / 72) * Math.PI * 2;
        const distortion = Math.sin(angle * 2 + time) * distortionAmount;
        const dynamicRadius = BASE_RADIUS + distortion;
        const px = center + Math.cos(angle) * dynamicRadius;
        const py = center + Math.sin(angle) * dynamicRadius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();

      const gradient = ctx.createRadialGradient(
        center + t.x,
        center + t.y,
        0,
        center + t.x,
        center + t.y,
        center
      );
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.12)`);
      gradient.addColorStop(CENTER_ZONE_RATIO, `rgba(${r}, ${g}, ${b}, 0.06)`);
      gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.03)`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, SIZE, SIZE);

      const colorBase = `rgba(${r}, ${g}, ${b}, `;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        const dx = p.x - center;
        const dy = p.y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const distortion = Math.sin(angle * 2 + time) * distortionAmount;
        const maxR = BASE_RADIUS + distortion - 4;

        if (dist > maxR) {
          const nx = (dx / dist) * maxR;
          const ny = (dy / dist) * maxR;
          p.x = center + nx;
          p.y = center + ny;
          const dot = p.vx * (nx / dist) + p.vy * (ny / dist);
          p.vx -= (nx / dist) * dot * 1.1;
          p.vy -= (ny / dist) * dot * 1.1;
        }
        if (dist < innerRing + 2) {
          const nx = (dx / dist) * (innerRing + 2);
          const ny = (dy / dist) * (innerRing + 2);
          p.x = center + nx;
          p.y = center + ny;
          const dot = p.vx * (nx / dist) + p.vy * (ny / dist);
          p.vx -= (nx / dist) * dot * 1.1;
          p.vy -= (ny / dist) * dot * 1.1;
        }

        p.x = Math.max(innerRing + 4, Math.min(SIZE - 4, p.x));
        p.y = Math.max(innerRing + 4, Math.min(SIZE - 4, p.y));

        ctx.save();
        ctx.shadowBlur = p.radius * 2;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.7})`;
        ctx.fillStyle = colorBase + p.opacity + ")";
        ctx.beginPath();
        ctx.arc(p.x + t.x, p.y + t.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
          background: `radial-gradient(ellipse at center, rgba(${cr},${cg},${cb},0.22) 0%, rgba(${cr},${cg},${cb},0.06) 45%, transparent 75%)`,
          boxShadow: `0 0 48px rgba(${cr},${cg},${cb},0.3), inset 0 0 36px rgba(${cr},${cg},${cb},0.04)`,
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
