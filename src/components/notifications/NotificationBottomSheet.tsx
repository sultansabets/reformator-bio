import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };
const SWIPE_CLOSE_PX = 120;

function getClosedOffset(): number {
  return typeof window !== "undefined" ? window.innerHeight : 1000;
}

type NotificationBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function NotificationBottomSheet({
  open,
  onClose,
  children,
}: NotificationBottomSheetProps) {
  const panelY = useMotionValue(getClosedOffset());
  const handleOffset = useMotionValue(0);
  const dragStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      panelY.set(getClosedOffset());
      return;
    }
    panelY.set(getClosedOffset());
    const ctrl = animate(panelY, 0, SPRING);
    return () => ctrl.stop();
  }, [open]);

  const closeSheet = () => {
    animate(panelY, getClosedOffset(), SPRING).then(onClose);
  };

  const handleDragStart = () => {
    dragStartY.current = panelY.get();
  };

  const handleDrag = (_: unknown, info: { offset: { y: number } }) => {
    const next = Math.max(0, dragStartY.current + info.offset.y);
    panelY.set(next);
    handleOffset.set(-info.offset.y);
  };

  const handleDragEnd = (_: unknown, info: { offset: { y: number } }) => {
    handleOffset.set(0);
    if (info.offset.y > SWIPE_CLOSE_PX) {
      closeSheet();
      return;
    }
    animate(panelY, 0, SPRING);
  };

  const handleOverlayClick = () => {
    closeSheet();
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!open) return null;

  return (
    <>
      <motion.div
        role="presentation"
        className="fixed inset-0 z-50 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleOverlayClick}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Уведомления"
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[95vh] flex-col overflow-hidden rounded-t-[20px] border-t border-border bg-background shadow-xl"
        style={{
          y: panelY,
          height: "85vh",
        }}
        initial={false}
        transition={SPRING}
        onClick={handlePanelClick}
      >
        <header className="flex shrink-0 flex-col pt-5">
          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{ y: handleOffset }}
            className={cn(
              "touch-none cursor-grab active:cursor-grabbing",
              "flex items-center justify-center pb-2"
            )}
            aria-label="Потяните вниз, чтобы закрыть"
          >
            <span className="h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/40" />
          </motion.div>
          <div className="absolute right-4 top-4">
            <button
              type="button"
              onClick={closeSheet}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {React.isValidElement(children)
            ? React.cloneElement(
                children as React.ReactElement<{
                  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
                }>,
                { scrollContainerRef }
              )
            : children}
        </div>
      </motion.div>
    </>
  );
}
