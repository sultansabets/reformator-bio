import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";

import StateOrb3D from "./StateOrb3D";

const SHOW_ORB = true;
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
      <div className="relative w-[320px] h-[320px]">
        {/* 3D Orb */}
        {SHOW_ORB && <StateOrb3D score={displayScore} />}

        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {mode === "energy" ? (
              <motion.div
                key="energy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative flex items-center justify-center px-6"
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
