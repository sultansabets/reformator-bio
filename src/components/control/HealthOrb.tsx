import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

const VISUAL_SIZE = 320;
const ATOM_COUNT = Math.floor(42 * 1.25 * 1.25);
const BASE_RADIUS = VISUAL_SIZE * 0.38;
const INNER_RADIUS = 40;
const MOUNT_DURATION_MS = 2000;

const CONTROL_POINTS = 16;
const BASE_AMPLITUDE = 8;
const MAX_AMPLITUDE = 12;
/** 1 full rotation ~15 sec at 60fps */
const ROTATION_SPEED = (2 * Math.PI) / (15 * 60);
const ENERGY_MODE_SEC = 30;
const QUOTE_MODE_SEC = 10;
const PARTICLES_FADE_MS = 400;

const QUOTES = [
  "Мы живем ту жизнь, на которую нам хватило смелости.",
  "Ты не сможешь изменить то, что готов оправдать.",
  "Все, что мы не меняем, мы выбираем.",
];

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

/** Returns -1..1; mix of waves for bulge + inward flow. phaseOffset makes bulge flow with rotation */
function smoothNoise(angle: number, time: number, seed: number, phaseOffset: number): number {
  const t = time * 0.00012;
  const a = angle + phaseOffset;
  const a1 = Math.sin(a * 2 + t * 0.9 + seed) * 0.45;
  const a2 = Math.sin(a * 3 + t * 0.6 + seed * 1.3) * 0.35;
  const a3 = Math.sin(a + t * 0.4 + seed * 0.7) * 0.2;
  return Math.max(-1, Math.min(1, a1 + a2 + a3));
}

/** Soft global swell: amplitude varies 1.0–1.04 over ~6 sec */
function getDeformMultiplier(elapsed: number): number {
  const t = elapsed * 0.001;
  return 1 + Math.sin(t * 1.0) * 0.02;
}

/** Asymmetric stretch: bulge in one region, squeeze in another */
function getSquishFactor(angle: number, rotation: number): number {
  const a = angle + rotation;
  const s1 = Math.sin(a * 2) * 0.02;
  const s2 = Math.cos(a * 3 + 0.5) * 0.015;
  return 1 + s1 + s2;
}

const MAX_BLOB_OFFSET = 0.15;

/** Creates a fixed blob Path2D: 6–8 polar points, radius = base ± 15%, smoothed with quadraticCurveTo. */
function createBlobPath(baseRadius: number): Path2D {
  const n = 6 + Math.floor(Math.random() * 3);
  const points: [number, number][] = [];
  const maxOffset = baseRadius * MAX_BLOB_OFFSET;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const offset = (Math.random() * 2 - 1) * maxOffset;
    const r = baseRadius + offset;
    points.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const p = new Path2D();
  p.moveTo(points[0][0], points[0][1]);
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const next = points[(i + 1) % n];
    const midX = (curr[0] + next[0]) / 2;
    const midY = (curr[1] + next[1]) / 2;
    const scale = 1.1;
    const ctrlX = midX * scale;
    const ctrlY = midY * scale;
    p.quadraticCurveTo(ctrlX, ctrlY, next[0], next[1]);
  }
  p.closePath();
  return p;
}

interface Atom {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  nucleusSize: number;
  opacity: number;
  maxOpacity: number;
  nucleusBlob: Path2D;
}

function spawnAtom(center: number): Atom {
  const spawnRadius = BASE_RADIUS - 2;
  const angle = Math.random() * Math.PI * 2;
  const x = center + Math.cos(angle) * spawnRadius;
  const y = center + Math.sin(angle) * spawnRadius;
  const dx = center - x;
  const dy = center - y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nucleusSize = 4 + Math.random() * 2;
  const nucleusRadius = nucleusSize / 2;
  return {
    x,
    y,
    dirX: dx / len,
    dirY: dy / len,
    speed: 0.4 + Math.random() * 0.2,
    nucleusSize,
    opacity: 0,
    maxOpacity: 0.7 + Math.random() * 0.3,
    nucleusBlob: createBlobPath(nucleusRadius),
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

function drawBlobAt(ctx: CanvasRenderingContext2D, x: number, y: number, blobPath: Path2D) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fill(blobPath);
  ctx.restore();
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
  const [mode, setMode] = useState<"energy" | "quote">("energy");
  const [quoteIndex, setQuoteIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const atomsRef = useRef<Atom[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const colorRef = useRef<string>("#34c759");
  const mountStartRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const noiseSeedsRef = useRef<number[]>([]);
  const modeRef = useRef<"energy" | "quote">("energy");
  const modeChangeTimeRef = useRef<number>(0);

  const color = useMemo(() => getColorFromScore(score), [score]);
  colorRef.current = color;
  const displayScore = Math.round(Math.min(100, Math.max(0, score)));

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      if (tick === ENERGY_MODE_SEC) {
        setMode("quote");
        modeRef.current = "quote";
        modeChangeTimeRef.current = performance.now();
      } else if (tick >= ENERGY_MODE_SEC + QUOTE_MODE_SEC) {
        tick = 0;
        setQuoteIndex((i) => (i + 1) % QUOTES.length);
        setMode("energy");
        modeRef.current = "energy";
        modeChangeTimeRef.current = performance.now();
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    reducedMotionRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (noiseSeedsRef.current.length === 0) {
      noiseSeedsRef.current = Array.from({ length: CONTROL_POINTS }, () => Math.random() * 100);
    }

    const center = VISUAL_SIZE / 2;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    if (!atomsRef.current) {
      atomsRef.current = Array.from({ length: ATOM_COUNT }, () => spawnAtom(center));
    }
    const atoms = atomsRef.current;
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
        rotationRef.current += ROTATION_SPEED * Math.min(dt, 2);
      }

      const hex = colorRef.current;
      const [r, g, b] = hexToRgb(hex);
      const rot = rotationRef.current;

      const deformMult = getDeformMultiplier(elapsed);
      const currentAmplitude = Math.min(BASE_AMPLITUDE * deformMult, MAX_AMPLITUDE);

      const controlRadii: number[] = [];
      for (let i = 0; i < CONTROL_POINTS; i++) {
        const angle = (i / CONTROL_POINTS) * Math.PI * 2;
        const noise = smoothNoise(angle, elapsed, seeds[i], rot * 1.15);
        const squish = getSquishFactor(angle, rot);
        const deformation = noise * currentAmplitude * squish;
        const radius = (BASE_RADIUS + deformation) * easeOut;
        controlRadii.push(Math.max(BASE_RADIUS * 0.5, radius));
      }

      ctx.clearRect(0, 0, VISUAL_SIZE * dpr, VISUAL_SIZE * dpr);

      ctx.save();
      ctx.scale(dpr, dpr);

      drawSmoothBlob(ctx, center, controlRadii, rot);
      ctx.save();
      ctx.clip();

      for (let i = 0; i < atoms.length; i++) {
        const atom = atoms[i];

        if (!reducedMotionRef.current) {
          atom.x += atom.dirX * atom.speed * dt;
          atom.y += atom.dirY * atom.speed * dt;

          const dx = atom.x - center;
          const dy = atom.y - center;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let targetOpacity = atom.maxOpacity;

          if (dist > fadeInStart) {
            targetOpacity *= Math.max(0, (spawnRadius - dist) / (spawnRadius - fadeInStart));
          }

          if (dist < fadeOutStart) {
            targetOpacity *= Math.max(0, (dist - INNER_RADIUS) / (fadeOutStart - INNER_RADIUS));
          }

          atom.opacity = targetOpacity;

          if (dist <= INNER_RADIUS) {
            atoms[i] = spawnAtom(center);
            continue;
          }
        } else {
          atom.opacity = atom.maxOpacity * 0.5;
        }

        const particlesOpacity = (() => {
          const m = modeRef.current;
          const t0 = modeChangeTimeRef.current;
          const progress = Math.min(1, (timestamp - t0) / PARTICLES_FADE_MS);
          const smooth = progress * progress * (3 - 2 * progress);
          return m === "energy" ? smooth : 1 - smooth;
        })();

        const op = atom.opacity * mountProgress * particlesOpacity;
        if (op < 0.03) continue;

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.globalAlpha = op;
        drawBlobAt(ctx, atom.x, atom.y, atom.nucleusBlob);
      }

      ctx.globalAlpha = 1;
      ctx.restore();

      drawSmoothBlob(ctx, center, controlRadii, rot);
      ctx.strokeStyle = hex;
      ctx.lineWidth = 0.28;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none overflow-hidden">
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center px-6 transition-opacity duration-[400ms] ease-out ${
              mode === "energy" ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("metrics.state")}
            </span>
            <span className="mt-2 text-5xl font-bold tracking-tight text-foreground">
              {displayScore}%
            </span>
          </div>
          <div
            className={`absolute inset-0 flex items-center justify-center px-6 transition-opacity duration-[400ms] ease-out ${
              mode === "quote" ? "opacity-100 delay-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-[20%] rounded-full bg-black/[0.04]" aria-hidden />
            <p className="relative max-w-[80%] text-center text-sm font-normal leading-relaxed text-foreground/75">
              «{QUOTES[quoteIndex]}»
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
