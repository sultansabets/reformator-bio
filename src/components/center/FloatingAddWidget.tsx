import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type FloatingAddOption = {
  id: string;
  icon: React.ReactNode;
  label: string;
};

type FloatingAddWidgetProps = {
  mainIcon: React.ReactNode;
  options: FloatingAddOption[];
  onSelect: (optionId: string) => void;
  ariaLabel: string;
  className?: string;
};

export function FloatingAddWidget({
  mainIcon,
  options,
  onSelect,
  ariaLabel,
  className = "",
}: FloatingAddWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    setExpanded(false);
  };

  return (
    <div className={`relative flex flex-col-reverse items-end gap-3 ${className}`}>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col-reverse gap-3 overflow-hidden"
          >
            {options.map((opt) => (
              <motion.button
                key={opt.id}
                type="button"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleSelect(opt.id)}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-card text-foreground shadow-lg transition-colors hover:bg-muted hover:border-primary"
                aria-label={opt.label}
                title={opt.label}
              >
                {opt.icon}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95"
        aria-label={ariaLabel}
        aria-expanded={expanded}
      >
        {mainIcon}
      </button>
    </div>
  );
}
