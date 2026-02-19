import React, { useRef, useEffect, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const SIZE = 250;
const PARTICLE_COUNT = 200;

/** Score-based theme: 0-40 red, 41-70 orange, 71-100 green */
const getThemeFromScore = (score: number) => {
  const s = Math.min(100, Math.max(0, score));
  if (s >= 71) return { hex: "#22C55E", label: "ВЫСОКОЕ" };
  if (s >= 41) return { hex: "#F59E0B", label: "УМЕРЕННОЕ" };
  return { hex: "#EF4444", label: "НИЗКОЕ" };
};

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
  const maxRadius = center - 20;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5;
    const r = 10 + Math.random() * maxRadius * 0.8;
    particles.push({
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      radius: 0.8 + Math.random() * 1.2,
      opacity: 0.15 + Math.random() * 0.35,
    });
  }
  return particles;
}

interface HealthCoreProps {
  score: number;
}

const PARALLAX_SENSITIVITY = 0.4;

export default function HealthCore({ score }: HealthCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const tiltRef = useRef({ x: 0, y: 0 });
  const themeHexRef = useRef<string>("");
  const { theme } = useTheme();

  const themeData = useMemo(() => getThemeFromScore(score), [score]);
  themeHexRef.current = themeData.hex;
  const displayScore = Math.round(Math.min(100, Math.max(0, score)));

  const isDark = theme === "dark";

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

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      const hex = themeHexRef.current;
      const [r, g, b] = hexToRgb(hex);
      const color = `rgba(${r}, ${g}, ${b}, `;

      const ox = tiltRef.current.x;
      const oy = tiltRef.current.y;

      const gradient = ctx.createRadialGradient(
        center + ox,
        center + oy,
        0,
        center + ox,
        center + oy,
        center
      );
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.12)`);
      gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.04)`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, SIZE, SIZE);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > SIZE) p.vx *= -1;
        if (p.y < 0 || p.y > SIZE) p.vy *= -1;
        p.x = Math.max(0, Math.min(SIZE, p.x));
        p.y = Math.max(0, Math.min(SIZE, p.y));

        const drawX = p.x + ox;
        const drawY = p.y + oy;

        ctx.beginPath();
        ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = color + p.opacity + ")";
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      tiltRef.current = {
        x: Math.max(-15, Math.min(15, gamma * PARALLAX_SENSITIVITY)),
        y: Math.max(-15, Math.min(15, (beta - 45) * PARALLAX_SENSITIVITY)),
      };
    };

    if (typeof DeviceOrientationEvent !== "undefined") {
      if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
        (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
          .requestPermission()
          .then(() => window.addEventListener("deviceorientation", handleOrientation))
          .catch(() => {});
      } else {
        window.addEventListener("deviceorientation", handleOrientation);
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  const glowColor = themeData.hex;
  const glowOpacity = isDark ? 0.2 : 0.25;
  const coreBg = isDark ? "rgba(15, 15, 18, 0.95)" : "rgba(250, 250, 250, 0.98)";

  return (
    <div
      className="relative flex h-[250px] w-[250px] items-center justify-center overflow-hidden rounded-full"
      style={{
        background: `radial-gradient(ellipse at center, ${coreBg} 0%, ${coreBg} 70%, transparent 100%)`,
        boxShadow: `0 0 40px ${hexToRgba(glowColor, glowOpacity)}, inset 0 0 30px ${hexToRgba(glowColor, 0.04)}`,
        animation: "health-core-pulse 4s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes health-core-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>

      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="absolute left-0 top-0"
        style={{ width: SIZE, height: SIZE }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-5xl font-bold tracking-tight text-foreground">
          {displayScore}
        </span>
        <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Состояние
        </span>
        <span
          className="mt-1 text-sm font-semibold uppercase tracking-wide"
          style={{ color: themeData.hex }}
        >
          {themeData.label}
        </span>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.slice(1).match(/.{2}/g);
  if (!m) return [255, 255, 255];
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
