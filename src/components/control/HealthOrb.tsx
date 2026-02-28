import React, { useState, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";

const Spline = lazy(() => import("@splinetool/react-spline"));

const VISUAL_SIZE = 320;
const ENERGY_MODE_SEC = 30;
const QUOTE_MODE_SEC = 10;

const QUOTES = [
  "Мы живем ту жизнь, на которую нам хватило смелости.",
  "Ты не сможешь изменить то, что готов оправдать.",
  "Все, что мы не меняем, мы выбираем.",
];

interface HealthOrbProps {
  score: number;
}

export default function HealthOrb({ score }: HealthOrbProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"energy" | "quote">("energy");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [splineLoaded, setSplineLoaded] = useState(false);

  const displayScore = Math.round(Math.min(100, Math.max(0, score)));

  useEffect(() => {
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      if (tick === ENERGY_MODE_SEC) {
        setMode("quote");
      } else if (tick >= ENERGY_MODE_SEC + QUOTE_MODE_SEC) {
        tick = 0;
        setQuoteIndex((i) => (i + 1) % QUOTES.length);
        setMode("energy");
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex h-[300px] w-[340px] items-center justify-center overflow-visible">
      <div className="relative flex h-[320px] w-[320px] shrink-0 items-center justify-center">
        {/* Spline background */}
        <div
          className="absolute inset-0"
          style={{ width: VISUAL_SIZE, height: VISUAL_SIZE }}
        >
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-[240px] w-[240px] animate-pulse rounded-full bg-white/5" />
              </div>
            }
          >
            <Spline
              scene="https://prod.spline.design/VNfSTbA6ivm3pIVa/scene.splinecode"
              onLoad={() => setSplineLoaded(true)}
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </Suspense>
        </div>

        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center pointer-events-none overflow-hidden">
          <AnimatePresence mode="wait">
            {mode === "energy" ? (
              <motion.div
                key="energy"
                initial={{ opacity: 0 }}
                animate={{ opacity: splineLoaded ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center"
              >
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("metrics.state")}
                </span>
                <span className="mt-2 text-5xl font-bold tracking-tight text-foreground">
                  {displayScore}%
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="quote"
                initial={{ opacity: 0 }}
                animate={{ opacity: splineLoaded ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative flex items-center justify-center"
              >
                <div className="absolute inset-[20%] rounded-full bg-black/[0.04]" aria-hidden />
                <p className="relative max-w-[80%] text-center text-sm font-normal leading-relaxed text-foreground/75">
                  «{QUOTES[quoteIndex]}»
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
