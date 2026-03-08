import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export interface BaselineSuccessBannerProps {
  show: boolean;
}

export function BaselineSuccessBanner({ show }: BaselineSuccessBannerProps) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mb-4 flex flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-center"
    >
      <p className="text-sm font-medium text-foreground">
        {t("adaptationDetail.baselineEstablished")}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t("adaptationDetail.baselineEstablishedSubtitle")}
      </p>
    </motion.div>
  );
}
