import React, { useEffect, useRef, useState } from "react";
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
    const baseRadius = 55;
    let startTime: number | null = null;

    const draw = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, size * dpr, size * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      const breathe = Math.sin(elapsed / 3000) * 0.05 + 1;
      const glowIntensity = Math.sin(elapsed / 4000) * 0.1 + 0.9;
      const radius = baseRadius * breathe;

      const floatX = Math.sin(elapsed / 5000) * 2;
      const floatY = Math.cos(elapsed / 6000) * 1.5;
      const moonCenterX = center + floatX;
      const moonCenterY = center + floatY;

      const glowGradient = ctx.createRadialGradient(
        moonCenterX,
        moonCenterY,
        radius * 0.5,
        moonCenterX,
        moonCenterY,
        radius * 3
      );
      glowGradient.addColorStop(0, `rgba(253, 224, 71, ${0.15 * glowIntensity})`);
      glowGradient.addColorStop(0.3, `rgba(253, 224, 71, ${0.06 * glowIntensity})`);
      glowGradient.addColorStop(1, "rgba(253, 224, 71, 0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(moonCenterX, moonCenterY, radius, 0, Math.PI * 2);
      const moonGradient = ctx.createRadialGradient(
        moonCenterX - radius * 0.25,
        moonCenterY - radius * 0.25,
        0,
        moonCenterX,
        moonCenterY,
        radius
      );
      moonGradient.addColorStop(0, "#fefce8");
      moonGradient.addColorStop(0.4, "#fef08a");
      moonGradient.addColorStop(1, "#facc15");
      ctx.fillStyle = moonGradient;
      ctx.shadowBlur = 25 * glowIntensity;
      ctx.shadowColor = "rgba(250, 204, 21, 0.5)";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(
        moonCenterX + radius * 0.32,
        moonCenterY - radius * 0.12,
        radius * 0.72,
        0,
        Math.PI * 2
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
      style={{ width: 200, height: 200 }}
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
    <p className="text-6xl font-extralight text-white/90 tabular-nums tracking-wider">
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
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex flex-col bg-[#050508]"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
        >
          <MoonAnimation />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-10 text-center"
        >
          <CurrentTime />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
            {t("sleepMode.wakeAt")}
          </p>
          <p className="text-2xl font-light text-gray-400 tabular-nums">
            {wakeTime}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="w-full px-5 pb-10"
      >
        <Button
          variant="ghost"
          className="w-full h-12 text-gray-500 hover:text-white hover:bg-white/5 transition-colors duration-200"
          onClick={onCancel}
        >
          {t("sleepMode.cancel")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
