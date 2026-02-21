import React, { useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

const VISUAL_SIZE = 320;
const BLOB_SEGMENTS = 125;
const PARTICLE_COUNT = 60;
const BASE_RADIUS = VISUAL_SIZE * 0.38;
const TEXT_SAFE_RADIUS = 70;
const INNER_RADIUS = TEXT_SAFE_RADIUS - 5;
const MOUNT_DURATION_MS = 2000;
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
  speed: number;
  baseSize: number;
  size: number;
  opacity: number;
  maxOpacity: number;
  satelliteCount: number;
  satelliteAngle: number;
}

function spawnParticle(center: number): Particle {
  const edgeR = BASE_RADIUS * 0.92;
  const angle = Math.random() * Math.PI * 2;
  return {
    x: center + Math.cos(angle) * edgeR,
    y: center + Math.sin(angle) * edgeR,
    speed: 0.6 + Math.random() * 0.3,
    baseSize: 4 + Math.random() * 3,
    size: 4 + Math.random() * 3,
    opacity: 0,
    maxOpacity: 0.7 + Math.random() * 0.3,
    satelliteCount: 1 + Math.floor(Math.random() * 2),
    satelliteAngle: Math.random() * Math.PI * 2,
  };
}

function updateParticle(p: Particle, center: number, dt: number): boolean {
  const dx = center - p.x;
  const dy = center - p.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= INNER_RADIUS) {
    return true;
  }

  const nx = dx / dist;
  const ny = dy / dist;
  const moveSpeed = p.speed * dt * 60;
  p.x += nx * moveSpeed;
  p.y += ny * moveSpeed;

  const edgeR = BASE_RADIUS * 0.92;
  const fadeInZone = 10;
  const fadeOutZone = 20;

  let targetOpacity = p.maxOpacity;

  const newDist = Math.sqrt((p.x - center) ** 2 + (p.y - center) ** 2);

  if (newDist > edgeR - fadeInZone) {
    targetOpacity *= Math.min(1, (edgeR - newDist) / fadeInZone);
  }

  if (newDist < INNER_RADIUS + fadeOutZone) {
    const t = (newDist - INNER_RADIUS) / fadeOutZone;
    targetOpacity *= Math.max(0, t);
    p.size = p.baseSize * (0.3 + 0.7 * Math.max(0, t));
  } else {
    p.size = p.baseSize;
  }

  p.opacity = targetOpacity;

  return false;
}

interface HealthOrbProps {
  score: number;
}

export default function HealthOrb({ score }: HealthOrbProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLightRef = useRef(theme === "light");
  isLightRef.current = theme === "light";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const colorRef = useRef<string>("#34c759");
  const timeRef = useRef(0);
  const mountStartRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const reducedMotionRef = useRef(false);

  const color = useMemo(() => getColorFromScore(score), [score]);
  colorRef.current = color;
  const displayScore = Math.round(Math.min(100, Math.max(0, score)));

  useEffect(() => {
    reducedMotionRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const center = VISUAL_SIZE / 2;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    if (!particlesRef.current) {
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => spawnParticle(center));
    }
    const particles = particlesRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    canvas.width = VISUAL_SIZE * dpr;
    canvas.height = VISUAL_SIZE * dpr;

    const getDynamicRadius = (angle: number, t: number) => {
      const phase = (t / LIQUID_CYCLE_MS) * Math.PI * 2;
      return (
        BASE_RADIUS +
        Math.sin(angle * 3 + phase) * 3.08 +
        Math.cos(angle * 2 - phase * 0.7) * 2.45
      );
    };

    const draw = (timestamp: number) => {
      if (mountStartRef.current == null) {
        mountStartRef.current = timestamp;
        lastFrameRef.current = timestamp;
      }

      const dt = Math.min((timestamp - lastFrameRef.current) / 16.67, 2.5);
      lastFrameRef.current = timestamp;

      const elapsed = timestamp - mountStartRef.current;
      const mountProgress = Math.min(1, elapsed / MOUNT_DURATION_MS);
      const easeOut = 1 - Math.pow(1 - mountProgress, 1.3);

      if (!reducedMotionRef.current) {
        timeRef.current = elapsed * 0.001;
        rotationRef.current += 0.0012 * dt;
      }

      const hex = colorRef.current;
      const [r, g, b] = hexToRgb(hex);
      const rot = rotationRef.current;

      ctx.clearRect(0, 0, VISUAL_SIZE * dpr, VISUAL_SIZE * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(center, center);
      ctx.rotate(rot);
      ctx.translate(-center, -center);

      const pathPoints: [number, number][] = [];
      for (let i = 0; i <= BLOB_SEGMENTS; i++) {
        const angle = (i / BLOB_SEGMENTS) * Math.PI * 2;
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

      ctx.fillStyle = isLightRef.current ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.03)";
      ctx.fill();

      ctx.clip();

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reducedMotionRef.current) {
          const shouldRespawn = updateParticle(p, center, dt);
          if (shouldRespawn) {
            particles[i] = spawnParticle(center);
            continue;
          }
        } else {
          p.opacity = p.maxOpacity * 0.5;
        }

        const op = p.opacity * mountProgress;
        if (op < 0.02) continue;

        const mainR = p.size * 0.5;
        const satR = mainR * 0.35;
        const satDist = p.size * 1.0;

        ctx.globalAlpha = op * 0.2;
        ctx.lineWidth = 0.5;
        for (let s = 0; s < p.satelliteCount; s++) {
          const a = p.satelliteAngle + (s / p.satelliteCount) * Math.PI * 2;
          const sx = p.x + Math.cos(a) * satDist;
          const sy = p.y + Math.sin(a) * satDist;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }

        ctx.globalAlpha = op * 0.6;
        for (let s = 0; s < p.satelliteCount; s++) {
          const a = p.satelliteAngle + (s / p.satelliteCount) * Math.PI * 2;
          const sx = p.x + Math.cos(a) * satDist;
          const sy = p.y + Math.sin(a) * satDist;
          ctx.beginPath();
          ctx.arc(sx, sy, satR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = op;
        ctx.beginPath();
        ctx.arc(p.x, p.y, mainR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative flex h-[300px] w-[340px] items-center justify-center overflow-visible">
      <div className="relative flex h-[320px] w-[320px] shrink-0 items-center justify-center">
        <canvas
          ref={canvasRef}
          className="absolute left-0 top-0"
          style={{ width: VISUAL_SIZE, height: VISUAL_SIZE }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("metrics.state")}
          </span>
          <span className="mt-2 text-5xl font-bold tracking-tight text-foreground">
            {displayScore}%
          </span>
        </div>
      </div>
    </div>
  );
}
