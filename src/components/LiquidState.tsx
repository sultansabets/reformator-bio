import React, { useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getMetricColorHex } from "@/lib/colors";

const VISUAL_SIZE = 320;
const ATOM_COUNT = 42;
const BASE_RADIUS = VISUAL_SIZE * 0.38;
const INNER_RADIUS = 40;
const MOUNT_DURATION_MS = 2000;

const CONTROL_POINTS = 8;
const BASE_AMPLITUDE = 7;
const MAX_AMPLITUDE = 10;
const ROTATION_SPEED = 0.00015;
const TENSION_CYCLE_MS = 5000;
const TENSION_BURST_DURATION = 1000;

/** Metaball: marching squares grid resolution (56 for mobile perf) */
const GRID_RES = 56;
const THRESHOLD = 1;
const METABALL_RADIUS_SCALE = 2.8;
const EPS = 1e-6;

/** Marching squares: config (0-15) -> [edge pairs]. Corners: 0=TL, 1=TR, 2=BR, 3=BL. Edges: 0=top, 1=right, 2=bottom, 3=left */
const MS_EDGES: number[][] = [
  [], [3, 0], [0, 1], [3, 1], [1, 2], [3, 2, 0, 1], [0, 2], [3, 2], [2, 3], [0, 3], [1, 0, 2, 3], [1, 2], [1, 0], [2, 1], [2, 3], []
];

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.slice(1).match(/.{2}/g);
  if (!m) return [255, 59, 48];
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
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
  if (cyclePosition < burstStart) return 1;
  const burstProgress = (cyclePosition - burstStart) / TENSION_BURST_DURATION;
  return 1 + Math.sin(burstProgress * Math.PI) * 0.2;
}

function getSquishFactor(angle: number, rotation: number): number {
  const relativeAngle = angle + rotation;
  return 1 + Math.cos(relativeAngle * 2) * 0.015;
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
}

function spawnAtom(center: number): Atom {
  const spawnRadius = BASE_RADIUS - 2;
  const angle = Math.random() * Math.PI * 2;
  const x = center + Math.cos(angle) * spawnRadius;
  const y = center + Math.sin(angle) * spawnRadius;
  const dx = center - x;
  const dy = center - y;
  const len = Math.sqrt(dx * dx + dy * dy);
  return {
    x, y,
    dirX: dx / len, dirY: dy / len,
    speed: 0.4 + Math.random() * 0.2,
    nucleusSize: 4 + Math.random() * 2,
    opacity: 0,
    maxOpacity: 0.7 + Math.random() * 0.3,
  };
}

function catmullRomToBezier(
  p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number]
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
  const n = controlRadii.length;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + rotation;
    const r = controlRadii[i];
    points.push([center + Math.cos(angle) * r, center + Math.sin(angle) * r]);
  }
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const [cp1, cp2, end] = catmullRomToBezier(p0, p1, p2, p3);
    if (i === 0) ctx.moveTo(p1[0], p1[1]);
    ctx.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], end[0], end[1]);
  }
  ctx.closePath();
}

/** Metaball field: f(x,y) = Σ r²/(d²+ε). Uses nucleus only. */
function sampleField(x: number, y: number, atoms: Atom[], mountProgress: number): number {
  let sum = 0;
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i];
    const op = a.opacity * mountProgress;
    if (op < 0.03) continue;
    const dx = x - a.x;
    const dy = y - a.y;
    const d2 = dx * dx + dy * dy + EPS;
    const r = a.nucleusSize * METABALL_RADIUS_SCALE * op;
    sum += (r * r) / d2;
  }
  return sum;
}

/** Linear interpolation for contour crossing: t = (T - v0) / (v1 - v0) */
function lerp(v0: number, v1: number): number {
  const denom = v1 - v0;
  if (Math.abs(denom) < 1e-9) return 0.5;
  return (THRESHOLD - v0) / denom;
}

function pointKey(x: number, y: number): string {
  return `${Math.round(x * 1000) / 1000},${Math.round(y * 1000) / 1000}`;
}

/** Chain segments into closed path (polygon). segments = [pA,pB, pC,pD, ...] */
function chainSegments(segments: [number, number][]): [number, number][] {
  if (segments.length < 4) return segments.length >= 2 ? [segments[0], segments[1]] : [];
  const used = new Set<number>();
  const path: [number, number][] = [segments[0], segments[1]];
  const keyToSegStart = new Map<string, number[]>();
  for (let i = 0; i < segments.length; i += 2) {
    const k1 = pointKey(segments[i][0], segments[i][1]);
    const k2 = pointKey(segments[i + 1][0], segments[i + 1][1]);
    if (!keyToSegStart.has(k1)) keyToSegStart.set(k1, []);
    keyToSegStart.get(k1)!.push(i);
    if (!keyToSegStart.has(k2)) keyToSegStart.set(k2, []);
    keyToSegStart.get(k2)!.push(i);
  }
  let last = pointKey(segments[1][0], segments[1][1]);
  const firstKey = pointKey(segments[0][0], segments[0][1]);
  used.add(0);
  for (let step = 0; step < segments.length / 2; step++) {
    const starts = keyToSegStart.get(last) ?? [];
    let found = false;
    for (const si of starts) {
      if (used.has(si)) continue;
      const p0 = segments[si];
      const p1 = segments[si + 1];
      const k0 = pointKey(p0[0], p0[1]);
      const k1 = pointKey(p1[0], p1[1]);
      if (k0 === last) {
        path.push(p1);
        last = k1;
      } else {
        path.push(p0);
        last = k0;
      }
      used.add(si);
      found = true;
      break;
    }
    if (!found || last === firstKey) break;
  }
  return path;
}

/** Marching squares: compute metaball contour and return polygon points */
function marchingSquares(atoms: Atom[], mountProgress: number): [number, number][] {
  const rows = GRID_RES;
  const cols = GRID_RES;
  const cellW = VISUAL_SIZE / cols;
  const cellH = VISUAL_SIZE / rows;
  const segments: [number, number][] = [];

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x0 = i * cellW;
      const y0 = j * cellH;
      const v00 = sampleField(x0, y0, atoms, mountProgress);
      const v10 = sampleField(x0 + cellW, y0, atoms, mountProgress);
      const v11 = sampleField(x0 + cellW, y0 + cellH, atoms, mountProgress);
      const v01 = sampleField(x0, y0 + cellH, atoms, mountProgress);
      const c0 = v00 >= THRESHOLD ? 1 : 0;
      const c1 = v10 >= THRESHOLD ? 1 : 0;
      const c2 = v11 >= THRESHOLD ? 1 : 0;
      const c3 = v01 >= THRESHOLD ? 1 : 0;
      const config = c0 | (c1 << 1) | (c2 << 2) | (c3 << 3);
      const edges = MS_EDGES[config];
      if (edges.length === 0) continue;

      const cornerPts: [number, number][] = [
        [x0, y0], [x0 + cellW, y0], [x0 + cellW, y0 + cellH], [x0, y0 + cellH]
      ];
      const cornerVals = [v00, v10, v11, v01];
      const edgeEnds = [[0, 1], [1, 2], [2, 3], [3, 0]];

      for (let e = 0; e < edges.length; e += 2) {
        const e0 = edges[e];
        const e1 = edges[e + 1];
        const [a0, a1] = edgeEnds[e0];
        const [b0, b1] = edgeEnds[e1];
        const tA = lerp(cornerVals[a0], cornerVals[a1]);
        const tB = lerp(cornerVals[b0], cornerVals[b1]);
        const pA: [number, number] = [
          cornerPts[a0][0] + tA * (cornerPts[a1][0] - cornerPts[a0][0]),
          cornerPts[a0][1] + tA * (cornerPts[a1][1] - cornerPts[a0][1])
        ];
        const pB: [number, number] = [
          cornerPts[b0][0] + tB * (cornerPts[b1][0] - cornerPts[b0][0]),
          cornerPts[b0][1] + tB * (cornerPts[b1][1] - cornerPts[b0][1])
        ];
        segments.push(pA, pB);
      }
    }
  }

  const path = chainSegments(segments);
  return path;
}

interface LiquidStateProps {
  score: number;
}

export default function LiquidState({ score }: LiquidStateProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const atomsRef = useRef<Atom[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const colorRef = useRef<string>("#34c759");
  const mountStartRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const noiseSeedsRef = useRef<number[]>([]);

  const color = useMemo(() => getMetricColorHex(score), [score]);
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
          }
        } else {
          atom.opacity = atom.maxOpacity * 0.5;
        }
      }

      ctx.clearRect(0, 0, VISUAL_SIZE * dpr, VISUAL_SIZE * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      drawSmoothBlob(ctx, center, controlRadii, rot);
      ctx.clip();

      const path = marchingSquares(atoms, mountProgress);
      if (path.length >= 3) {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i][0], path[i][1]);
        }
        ctx.closePath();
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
