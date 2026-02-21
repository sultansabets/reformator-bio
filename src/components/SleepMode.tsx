import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface SleepModeProps {
  wakeTime: string;
  onCancel: () => void;
}

function MoonAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 200;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const center = size / 2;
    const baseRadius = 60;
    let startTime: number | null = null;

    const draw = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, size * dpr, size * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      const breathe = Math.sin(elapsed / 2000) * 0.08 + 1;
      const glowIntensity = Math.sin(elapsed / 3000) * 0.15 + 0.85;
      const radius = baseRadius * breathe;

      const gradient = ctx.createRadialGradient(
        center,
        center,
        radius * 0.3,
        center,
        center,
        radius * 2.5
      );
      gradient.addColorStop(0, `rgba(253, 224, 71, ${0.2 * glowIntensity})`);
      gradient.addColorStop(0.4, `rgba(253, 224, 71, ${0.08 * glowIntensity})`);
      gradient.addColorStop(1, "rgba(253, 224, 71, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      const moonGradient = ctx.createRadialGradient(
        center - radius * 0.3,
        center - radius * 0.3,
        0,
        center,
        center,
        radius
      );
      moonGradient.addColorStop(0, "#fef3c7");
      moonGradient.addColorStop(0.5, "#fde68a");
      moonGradient.addColorStop(1, "#fcd34d");
      ctx.fillStyle = moonGradient;
      ctx.shadowBlur = 30 * glowIntensity;
      ctx.shadowColor = "rgba(253, 224, 71, 0.6)";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(center + radius * 0.35, center - radius * 0.15, radius * 0.75, 0, Math.PI * 2);
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
      style={{ width: 200, height: 200 }}
      className="mx-auto"
    />
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
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0f]"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        >
          <MoonAnimation />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500 uppercase tracking-widest">
            {t("sleepMode.wakeAt")}
          </p>
          <p className="mt-2 text-5xl font-light text-white tabular-nums tracking-wide">
            {wakeTime}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="w-full px-8 pb-12"
      >
        <Button
          variant="ghost"
          className="w-full h-12 text-gray-500 hover:text-white hover:bg-white/5 transition-colors duration-300"
          onClick={onCancel}
        >
          {t("sleepMode.cancel")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
