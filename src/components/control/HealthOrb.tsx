import React, { useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

const VISUAL_SIZE = 320;
const PARTICLE_COUNT = 45;
const BASE_RADIUS = VISUAL_SIZE * 0.38;
const INNER_RADIUS = 40;
const MOUNT_DURATION_MS = 2000;

const CONTROL_POINTS = 8;
const BASE_AMPLITUDE = 7;
const MAX_AMPLITUDE = 10;
const ROTATION_SPEED = 0.00015;
const TENSION_CYCLE_MS = 5000;
const TENSION_BURST_DURATION = 1000;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.slice(1).match(/.{2}/g);
  if (!m) return [255, 59, 48];
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}

function getColorFromScore(score: number): string {
  const s = Math.min(100, Math.max(0, score));
  if (s >= 76) return "#34c759";
  if (s >= 61) return "#facc15";
  if (s >= 41) return "#ff9f0a";
  return "#ff3b30";
}

function smoothNoise(angle: number, time: number, seed: number): number {
  const t = time * 0.0001;
  const a1 = Math.sin(angle * 2 + t * 0.7 + seed) * 0.5;
  const a2 = Math.sin(angle * 3 + t * 0.5 + seed * 1.3) * 0.3;
  const a3 = Math.sin(angle + t * 0.3 + seed * 0.7) * 0.2;
  return a1 + a2 + a3;
}

function getTensionMultiplier(elapsed: number): number {
  const cyclePosition = elapsed % TENSION_CYCLE_MS;
  const burstStart = TENSION_CYCLE_MS - TENSION_BURST_DURATION;
  
  if (cyclePosition < burstStart) {
    return 1;
  }
  
  const burstProgress = (cyclePosition - burstStart) / TENSION_BURST_DURATION;
  const burstCurve = Math.sin(burstProgress * Math.PI);
  return 1 + burstCurve * 0.2;
}

function getSquishFactor(angle: number, rotation: number): number {
  const relativeAngle = angle + rotation;
  const squish = Math.cos(relativeAngle * 2) * 0.015;
  return 1 + squish;
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

function catmullRomToBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): [[number, number], [number, number], [number, number]] {
  const tension = 6;
  return [
    [p1[0] + (p2[0] - p0[0]) / tension, p1[1] + (p2[1] - p0[1]) / tension],
    [p2[0] - (p3[0] - p1[0]) / tension, p2[1] - (p3[1] - p1[1]) / tension],
    [p2[0], p2[1]],
  ];
}

function drawSmoothBlob(
  ctx: CanvasRenderingContext2D,
  center: number,
  controlRadii: number[],
  rotation: number
) {
  const points: [number, number][] = [];
  const numPoints = controlRadii.length;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 + rotation;
    const radius = controlRadii[i];
    points.push([
      center + Math.cos(angle) * radius,
      center + Math.sin(angle) * radius,
    ]);
  }

  ctx.beginPath();
  
  for (let i = 0; i < numPoints; i++) {
    const p0 = points[(i - 1 + numPoints) % numPoints];
    const p1 = points[i];
    const p2 = points[(i + 1) % numPoints];
    const p3 = points[(i + 2) % numPoints];

    const [cp1, cp2, end] = catmullRomToBezier(p0, p1, p2, p3);

    if (i === 0) {
      ctx.moveTo(p1[0], p1[1]);
    }
    ctx.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], end[0], end[1]);
  }

  ctx.closePath();
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
  const noiseSeedsRef = useRef<number[]>([]);

  const color = useMemo(() => getColorFromScore(score), [score]);
  colorRef.current = color;
  const displayScore = Math.round(Math.min(100, Math.max(0, score)));

  useEffect(() => {
    reducedMotionRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (noiseSeedsRef.current.length === 0) {
      noiseSeedsRef.current = Array.from({ length: CONTROL_POINTS }, () => Math.random() * 100);
    }

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
    const seeds = noiseSeedsRef.current;

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
        rotationRef.current += ROTATION_SPEED * dt;
      }

      const hex = colorRef.current;
      const [r, g, b] = hexToRgb(hex);
      const rot = rotationRef.current;

      const tensionMult = getTensionMultiplier(elapsed);
      const currentAmplitude = Math.min(BASE_AMPLITUDE * tensionMult, MAX_AMPLITUDE);

      const controlRadii: number[] = [];
      for (let i = 0; i < CONTROL_POINTS; i++) {
        const angle = (i / CONTROL_POINTS) * Math.PI * 2;
        const noise = smoothNoise(angle, elapsed, seeds[i]);
        const squish = getSquishFactor(angle, rot);
        const deformation = noise * currentAmplitude * squish;
        const radius = (BASE_RADIUS + deformation) * easeOut;
        controlRadii.push(Math.max(BASE_RADIUS * 0.5, radius));
      }

      ctx.clearRect(0, 0, VISUAL_SIZE * dpr, VISUAL_SIZE * dpr);

      ctx.save();
      ctx.scale(dpr, dpr);

      drawSmoothBlob(ctx, center, controlRadii, rot);

      ctx.fillStyle = isLightRef.current ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.03)";
      ctx.fill();

      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();

      ctx.save();
      ctx.scale(dpr, dpr);

      drawSmoothBlob(ctx, center, controlRadii, rot);
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
