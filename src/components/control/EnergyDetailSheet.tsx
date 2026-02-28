import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { EnergyEngineResult } from "@/engine/energyEngine";

interface EnergyDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  energyDetail: EnergyEngineResult | null;
}

export function EnergyDetailSheet({ open, onOpenChange, energyDetail }: EnergyDetailSheetProps) {
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, handleClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!energyDetail) return null;

  const { energyScore } = energyDetail;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-[90%] max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-xl font-semibold" style={{ color: "#37BE7E" }}>
                Состояние — {energyScore}%
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="overflow-y-auto px-5 pb-6 pt-4"
              style={{ maxHeight: "calc(80vh - 64px)", WebkitOverflowScrolling: "touch" }}
            >
              <div className="text-sm text-foreground leading-relaxed space-y-4">
                <p>
                  Состояние – это твоя текущая готовность к физической и умственной нагрузке.
                </p>
                <p>
                  Оно формируется из двух факторов:
                </p>
                <p>
                  <strong>Сон</strong> – насколько ты восстановился.<br />
                  <strong>Нагрузка</strong> – сколько давления уже получил организм.
                </p>
                <p>
                  Если ты восстановился и не перегружен – ты в ресурсе.<br />
                  Если нагрузка превышает восстановление – ты работаешь в долг у своего организма.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
