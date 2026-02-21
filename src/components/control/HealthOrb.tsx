import React, { useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

const VISUAL_SIZE = 320;
const BLOB_SEGMENTS = 125;
const PARTICLE_COUNT = 45;
const BASE_RADIUS = VISUAL_SIZE * 0.38;
const INNER_RADIUS = 40;
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
  dirX: number;
  dirY: number;
  speed: number;
  size: number;
  opacity: number;
  maxOpacity: number;
}

function spawnParticle(center: number): Particle {
  const spawnRadius = BASE_RADIUS - 2;
  const angle = Math.random() * Math.PI * 2;
  const x = center + Math.cos(angle) * spawnRadius;
  const y = center + Math.sin(angle) * spawnRadius;
  const dx = center - x;
  const dy = center - y;
  const len = Math.sqrt(dx * dx + dy * dy);
  return {
    x,
    y,
    dirX: dx / len,
    dirY: dy / len,
    speed: 0.4 + Math.random() * 0.15,
    size: 4 + Math.random() * 2,
    opacity: 0,
    maxOpacity: 0.75 + Math.random() * 0.25,
  };
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

    const spawnRadius = BASE_RADIUS - 2;
    const fadeInStart = spawnRadius - 15;
    const fadeOutStart = INNER_RADIUS + 25;

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

      const frameDelta = timestamp - lastFrameRef.current;
      const dt = Math.min(frameDelta / 16.67, 2);
      lastFrameRef.current = timestamp;

      const elapsed = timestamp - mountStartRef.current;
      const mountProgress = Math.min(1, elapsed / MOUNT_DURATION_MS);
      const easeOut = 1 - Math.pow(1 - mountProgress, 1.3);

      if (!reducedMotionRef.current) {
        rotationRef.current += 0.001 * dt;
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

      ctx.restore();

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.beginPath();
      for (let i = 0; i <= BLOB_SEGMENTS; i++) {
        const angle = (i / BLOB_SEGMENTS) * Math.PI * 2;
        const dynamicRadius = getDynamicRadius(angle, elapsed);
        const px = center + Math.cos(angle + rot) * Math.max(2, dynamicRadius * easeOut);
        const py = center + Math.sin(angle + rot) * Math.max(2, dynamicRadius * easeOut);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reducedMotionRef.current) {
          p.x += p.dirX * p.speed * dt;
          p.y += p.dirY * p.speed * dt;

          const dx = p.x - center;
          const dy = p.y - center;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let targetOpacity = p.maxOpacity;

          if (dist > fadeInStart) {
            targetOpacity *= Math.max(0, (spawnRadius - dist) / (spawnRadius - fadeInStart));
          }

          if (dist < fadeOutStart) {
            targetOpacity *= Math.max(0, (dist - INNER_RADIUS) / (fadeOutStart - INNER_RADIUS));
          }

          p.opacity = targetOpacity;

          if (dist <= INNER_RADIUS) {
            particles[i] = spawnParticle(center);
            continue;
          }
        } else {
          p.opacity = p.maxOpacity * 0.5;
        }

        const op = p.opacity * mountProgress;
        if (op < 0.03) continue;

        ctx.globalAlpha = op;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
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
