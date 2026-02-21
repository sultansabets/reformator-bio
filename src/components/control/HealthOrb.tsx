import React, { useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

const VISUAL_SIZE = 320;
const BLOB_SEGMENTS = 125;
const PARTICLE_COUNT = 80;
const BASE_RADIUS = VISUAL_SIZE * 0.38;
const TEXT_SAFE_RADIUS = 70;
const ABSORB_RADIUS = TEXT_SAFE_RADIUS + 12;
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
  angle: number;
  angleDrift: number;
  speed: number;
  size: number;
  baseSize: number;
  opacity: number;
  maxOpacity: number;
  satelliteCount: number;
  satelliteAngleOffset: number;
  phase: number;
}

function createParticle(center: number): Particle {
  const edgeR = BASE_RADIUS * 0.92;
  const angle = Math.random() * Math.PI * 2;
  const r = edgeR - 2 - Math.random() * 6;
  const baseSize = 2.0 + Math.random() * 2.8;
  return {
    x: center + Math.cos(angle) * r,
    y: center + Math.sin(angle) * r,
    angle,
    angleDrift: (Math.random() - 0.5) * 0.015,
    speed: 0.4 + Math.random() * 0.35,
    size: baseSize,
    baseSize,
    opacity: 0,
    maxOpacity: 0.35 + Math.random() * 0.55,
    satelliteCount: 1 + Math.floor(Math.random() * 2),
    satelliteAngleOffset: Math.random() * Math.PI * 2,
    phase: Math.random() * Math.PI * 2,
  };
}

function updateParticle(p: Particle, center: number, mountProgress: number, dt: number, time: number) {
  const edgeR = BASE_RADIUS * 0.92;
  const fadeOutStart = ABSORB_RADIUS + 30;
  const respawnDist = 8;

  const dx = center - p.x;
  const dy = center - p.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  p.angleDrift += (Math.random() - 0.5) * 0.003;
  p.angleDrift = Math.max(-0.025, Math.min(0.025, p.angleDrift));

  const noiseDrift = Math.sin(time * 2 + p.phase) * 0.008;

  if (dist < respawnDist) {
    const angle = Math.random() * Math.PI * 2;
    const r = edgeR - 2 - Math.random() * 6;
    p.x = center + Math.cos(angle) * r;
    p.y = center + Math.sin(angle) * r;
    p.angleDrift = (Math.random() - 0.5) * 0.015;
    p.size = p.baseSize;
    p.opacity = 0;
    return;
  }

  const nx = dx / dist;
  const ny = dy / dist;

  const perpX = -ny;
  const perpY = nx;
  const drift = p.angleDrift + noiseDrift;

  const moveX = nx + perpX * drift;
  const moveY = ny + perpY * drift;
  const moveLen = Math.sqrt(moveX * moveX + moveY * moveY);

  const speed = p.speed * dt * 60;
  p.x += (moveX / moveLen) * speed;
  p.y += (moveY / moveLen) * speed;

  const newDist = Math.sqrt((p.x - center) ** 2 + (p.y - center) ** 2);

  let baseOpacity = p.maxOpacity;
  let scale = 1;

  if (mountProgress < 1) {
    baseOpacity = p.maxOpacity * mountProgress * mountProgress;
  } else if (newDist < fadeOutStart) {
    const t = Math.max(0, (newDist - respawnDist) / (fadeOutStart - respawnDist));
    baseOpacity = p.maxOpacity * t;
    scale = 0.4 + 0.6 * t;
  }

  const fadeInZone = 15;
  if (newDist > edgeR - fadeInZone) {
    baseOpacity *= Math.min(1, (edgeR - newDist) / fadeInZone);
  }

  p.opacity = baseOpacity;
  p.size = p.baseSize * scale;
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
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => createParticle(center));
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

      const dt = Math.min((timestamp - lastFrameRef.current) / 16.67, 2);
      lastFrameRef.current = timestamp;

      const elapsed = timestamp - mountStartRef.current;
      const mountProgress = Math.min(1, elapsed / MOUNT_DURATION_MS);
      const easeOut = 1 - Math.pow(1 - mountProgress, 1.3);

      if (!reducedMotionRef.current) {
        timeRef.current = elapsed * 0.001;
        rotationRef.current += 0.0015 * dt;
      }

      const hex = colorRef.current;
      const [r, g, b] = hexToRgb(hex);
      const time = timeRef.current;
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

      if (particles.length > 0) {
        for (const p of particles) {
          if (!reducedMotionRef.current) {
            updateParticle(p, center, mountProgress, dt, time);
          } else {
            p.opacity = p.maxOpacity * 0.6;
          }

          if (p.opacity > 0.02) {
            const mainR = p.size * 0.55;
            const satR = mainR * 0.35;
            const satDist = p.size * 1.2;

            ctx.globalAlpha = p.opacity * 0.25;
            ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.lineWidth = 0.4;
            for (let s = 0; s < p.satelliteCount; s++) {
              const a = p.satelliteAngleOffset + (s / p.satelliteCount) * Math.PI * 2;
              const sx = p.x + Math.cos(a) * satDist;
              const sy = p.y + Math.sin(a) * satDist;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(sx, sy);
              ctx.stroke();
            }

            ctx.globalAlpha = p.opacity * 0.7;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            for (let s = 0; s < p.satelliteCount; s++) {
              const a = p.satelliteAngleOffset + (s / p.satelliteCount) * Math.PI * 2;
              const sx = p.x + Math.cos(a) * satDist;
              const sy = p.y + Math.sin(a) * satDist;
              ctx.beginPath();
              ctx.arc(sx, sy, satR, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, mainR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
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
