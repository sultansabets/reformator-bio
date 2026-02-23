import * as React from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useDragControls,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 275, damping: 27 };
const SNAP_HEIGHT_PCT = 0.9;
const CLOSE_THRESHOLD_PCT = 0.3;

function getSheetHeight(): number {
  return typeof window !== "undefined" ? window.innerHeight * SNAP_HEIGHT_PCT : 600;
}

interface SheetContextValue {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  dragControls: ReturnType<typeof useDragControls>;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

const UnifiedBottomSheetRoot = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  const sheetHeight = getSheetHeight();
  const closeThreshold = sheetHeight * CLOSE_THRESHOLD_PCT;
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    setIsExiting(false);
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleClose = React.useCallback(() => {
    setIsExiting(true);
  }, []);

  const handleDragEnd = React.useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const vy = info.velocity.y;
      const offset = info.offset.y;
      if (offset > closeThreshold || vy > 400) {
        handleClose();
      }
    },
    [closeThreshold, handleClose]
  );

  const handleAnimationComplete = React.useCallback(() => {
    if (isExiting) {
      onOpenChange(false);
    }
  }, [onOpenChange, isExiting]);

  if (typeof document === "undefined") return null;

  const content = (
    <SheetContext.Provider value={{ scrollRef, dragControls }}>
      <AnimatePresence>
        {open && (
          <>
            <UnifiedBottomSheetBackdrop
              key="backdrop"
              isExiting={isExiting}
              onClose={handleClose}
            />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-lg border-0 border-t border-border bg-card"
            style={{
              height: sheetHeight,
              backgroundColor: "hsl(var(--card))",
              WebkitTapHighlightColor: "transparent",
            }}
            initial={{ y: "100%" }}
            animate={isExiting ? { y: "100%" } : { y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            onAnimationComplete={isExiting ? handleAnimationComplete : undefined}
          >
            {children}
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </SheetContext.Provider>
  );

  return createPortal(content, document.body);
};

const UnifiedBottomSheetBackdrop = ({
  isExiting,
  onClose,
}: {
  isExiting: boolean;
  onClose: () => void;
}) => (
  <motion.div
    role="presentation"
    className="fixed inset-0 z-50 bg-black/80"
    initial={{ opacity: 0 }}
    animate={{ opacity: isExiting ? 0 : 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25 }}
    onClick={onClose}
    aria-hidden
    style={{ WebkitTapHighlightColor: "transparent" }}
  />
);

const HandleArea = () => {
  const ctx = React.useContext(SheetContext);
  if (!ctx) return null;
  return (
    <div
      onPointerDown={(e) => ctx.dragControls.start(e)}
      className="touch-none cursor-grab active:cursor-grabbing flex shrink-0 items-center justify-center py-3"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <span
        className="h-1.5 w-10 rounded-full bg-muted-foreground/40"
        aria-hidden
      />
    </div>
  );
};

const UnifiedBottomSheetContent = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-1 flex-col overflow-hidden", className)}
    {...props}
  >
    <HandleArea />
    {children}
  </div>
);

const UnifiedBottomSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "sticky top-0 z-10 shrink-0 border-b border-border bg-card px-5 pb-4 pt-0",
      className
    )}
    style={{ backgroundColor: "hsl(var(--card))" }}
    {...props}
  />
);

const UnifiedBottomSheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const ctx = React.useContext(SheetContext);
  return (
    <div
      ref={ctx?.scrollRef}
      className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4",
        className
      )}
      style={{
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
      {...props}
    />
  );
};

export const UnifiedBottomSheet = {
  Root: UnifiedBottomSheetRoot,
  Content: UnifiedBottomSheetContent,
  Header: UnifiedBottomSheetHeader,
  Body: UnifiedBottomSheetBody,
};
