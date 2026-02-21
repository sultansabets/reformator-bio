import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface SleepModeProps {
  wakeTime: string;
  onCancel: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

function MoonWithParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const center = size / 2;
    const baseRadius = 60;

    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * 50;
        particlesRef.current.push({
          x: center + Math.cos(angle) * dist,
          y: center + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.4 + 0.2,
        });
      }
    }

    let startTime: number | null = null;

    const draw = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, size * dpr, size * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      const particles = particlesRef.current;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        const dx = p.x - center;
        const dy = p.y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 130 || dist < 70) {
          p.vx *= -0.8;
          p.vy *= -0.8;
        }

        if (Math.random() < 0.01) {
          p.vx += (Math.random() - 0.5) * 0.05;
          p.vy += (Math.random() - 0.5) * 0.05;
        }

        const fadeOscillation = Math.sin(elapsed / 2000 + dist * 0.02) * 0.15;
        const currentOpacity = Math.max(0.1, Math.min(0.6, p.opacity + fadeOscillation));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253, 224, 71, ${currentOpacity})`;
        ctx.fill();
      }

      const breathe = Math.sin(elapsed / 4000) * 0.03 + 1;
      const glowIntensity = Math.sin(elapsed / 5000) * 0.12 + 0.88;
      const radius = baseRadius * breathe;

      const floatX = Math.sin(elapsed / 7000) * 2;
      const floatY = Math.cos(elapsed / 8000) * 1.5;
      const moonCenterX = center + floatX;
      const moonCenterY = center + floatY;

      const glowGradient = ctx.createRadialGradient(
        moonCenterX, moonCenterY, radius * 0.5,
        moonCenterX, moonCenterY, radius * 3.5
      );
      glowGradient.addColorStop(0, `rgba(253, 224, 71, ${0.18 * glowIntensity})`);
      glowGradient.addColorStop(0.25, `rgba(253, 224, 71, ${0.08 * glowIntensity})`);
      glowGradient.addColorStop(0.5, `rgba(253, 224, 71, ${0.03 * glowIntensity})`);
      glowGradient.addColorStop(1, "rgba(253, 224, 71, 0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(moonCenterX, moonCenterY, radius, 0, Math.PI * 2);
      const moonGradient = ctx.createRadialGradient(
        moonCenterX - radius * 0.25, moonCenterY - radius * 0.25, 0,
        moonCenterX, moonCenterY, radius
      );
      moonGradient.addColorStop(0, "#fefce8");
      moonGradient.addColorStop(0.35, "#fef08a");
      moonGradient.addColorStop(1, "#facc15");
      ctx.fillStyle = moonGradient;
      ctx.shadowBlur = 30 * glowIntensity;
      ctx.shadowColor = "rgba(250, 204, 21, 0.5)";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(
        moonCenterX + radius * 0.32,
        moonCenterY - radius * 0.12,
        radius * 0.72,
        0, Math.PI * 2
      );
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      ctx.restore();
      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 280, height: 280 }}
      className="mx-auto"
    />
  );
}

function CurrentTime() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-7xl font-extralight text-white/90 tabular-nums tracking-wider">
      {time}
    </p>
  );
}

export default function SleepMode({ wakeTime, onCancel }: SleepModeProps) {
  const { t } = useTranslation();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ 
        background: "linear-gradient(180deg, #050508 0%, #0a0a12 50%, #050508 100%)" 
      }}
    >
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      
      <div className="relative flex flex-1 flex-col items-center justify-center px-5">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
        >
          <MoonWithParticles />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <CurrentTime />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] mb-2">
            Будильник активен
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
            {t("sleepMode.wakeAt")}
          </p>
          <p className="text-3xl font-light text-gray-400 tabular-nums">
            {wakeTime}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="relative w-full px-5"
        style={{ paddingBottom: "calc(48px + env(safe-area-inset-bottom))" }}
      >
        <Button
          variant="ghost"
          className="w-full h-14 text-gray-600 hover:text-white hover:bg-white/5 transition-colors duration-300 text-base"
          onClick={onCancel}
        >
          {t("sleepMode.cancel")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
