import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export interface BaselineBannerProps {
  isLearning: boolean;
  collected: number;
  required: number;
}

export function BaselineBanner({ isLearning, collected, required }: BaselineBannerProps) {
  const { t } = useTranslation();

  if (!isLearning) return null;

  return (
    <div className="mb-4 flex flex-col items-center justify-center rounded-lg border border-muted bg-muted/30 px-4 py-3 text-center">
      <p className="text-sm font-medium text-foreground">
        {t("adaptationDetail.collecting")}
      </p>
      {collected > 0 && required > 0 && (
        <>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("adaptationDetail.dayOfRequired", { collected, required })}
          </p>
          <div className="mt-2 w-full max-w-[200px]">
            <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
              <motion.div
                className="h-full rounded bg-primary"
                initial={false}
                animate={{ width: `${(collected / required) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </>
      )}
      <p className="mt-2 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
        {t("adaptationDetail.learningExplanation")}
      </p>
    </div>
  );
}
