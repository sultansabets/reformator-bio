import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import type { SleepEngineResult } from "@/engine/sleepEngine";
import { SleepCharts } from "@/components/control/SleepCharts";

const WEAKEST_SUMMARY: Record<string, string> = {
  duration: "sleepDetail.aiDuration",
  continuity: "sleepDetail.aiContinuity",
  deep: "sleepDetail.aiArchitecture",
  rem: "sleepDetail.aiArchitecture",
  hrv: "sleepDetail.aiHRV",
};

function formatDateRu(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${day} ${month}`;
}

function getTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-");
}

interface SleepDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sleepDetail: SleepEngineResult | null;
  selectedDate?: string;
  nightsCount?: number;
}

export function SleepDetailSheet({
  open,
  onOpenChange,
  sleepDetail,
  selectedDate,
  nightsCount = 7,
}: SleepDetailSheetProps) {
  const { t } = useTranslation();
  const dateToShow = selectedDate ?? getTodayISO();
  const isToday = dateToShow === getTodayISO();

  if (!sleepDetail) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex h-[70vh] max-h-[70vh] flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader className="shrink-0 border-b border-border px-6 pb-4 pt-0 text-left">
            <h2 className="text-xl font-semibold text-foreground">
              {t("center.sleep")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isToday ? t("sleepDetail.today") : formatDateRu(dateToShow)}
            </p>
          </DrawerHeader>
          <div className="flex flex-1 items-center justify-center px-6">
            <p className="text-sm text-muted-foreground">
              {t("sleepDetail.noData")}
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  const { sleepScore, weakestBlockKey } = sleepDetail;
  const aiSummaryKey = WEAKEST_SUMMARY[weakestBlockKey] ?? WEAKEST_SUMMARY.duration;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="flex h-[70vh] max-h-[70vh] flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <DrawerHeader className="shrink-0 border-b border-border px-6 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold text-foreground">
            {t("center.sleep")} — {sleepScore}%
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isToday ? t("sleepDetail.today") : formatDateRu(dateToShow)}
          </p>
        </DrawerHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pt-5 pb-10"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={dateToShow}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* AI Summary */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sleepDetail.resultsBlock")}
                </h3>
                <p className="text-sm text-foreground leading-relaxed">{t(aiSummaryKey)}</p>
              </section>

              {/* Charts */}
              <SleepCharts 
                sleepDetail={sleepDetail} 
                nightsCount={nightsCount}
                selectedDate={dateToShow}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
