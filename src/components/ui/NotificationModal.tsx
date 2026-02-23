import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DURATION = 0.25;
const EASE = [0.25, 0.1, 0.25, 1];

function getSheetHeight(): number {
  return typeof window !== "undefined" ? window.innerHeight * 0.9 : 600;
}

export interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function NotificationModal({ open, onOpenChange, children }: NotificationModalProps) {
  const sheetHeight = getSheetHeight();

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (typeof document === "undefined") return null;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            role="presentation"
            className="fixed inset-0 z-50 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION, ease: EASE }}
            onClick={handleClose}
            aria-hidden
            style={{ WebkitTapHighlightColor: "transparent" }}
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-lg border-0 border-t border-border bg-card"
            style={{
              height: sheetHeight,
              backgroundColor: "hsl(var(--card))",
              WebkitTapHighlightColor: "transparent",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: DURATION, ease: EASE }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export interface NotificationModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

export function NotificationModalHeader({ className, onClose, children, ...props }: NotificationModalHeaderProps) {
  const handleClose = onClose ?? (() => {});
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-border bg-card px-5 pb-4 pt-4",
        className
      )}
      style={{ backgroundColor: "hsl(var(--card))" }}
      {...props}
    >
      <div className="flex-1">{children}</div>
      <button
        type="button"
        onClick={handleClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Закрыть"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export interface NotificationModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function NotificationModalBody({ className, ...props }: NotificationModalBodyProps) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4", className)}
      style={{
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
      {...props}
    />
  );
}
