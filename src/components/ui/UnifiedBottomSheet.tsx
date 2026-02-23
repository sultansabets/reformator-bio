import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

const SNAP_POINT = 0.92;

export interface UnifiedBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const UnifiedBottomSheetRoot = ({ open, onOpenChange, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    open={open}
    onOpenChange={onOpenChange}
    snapPoints={[SNAP_POINT]}
    shouldScaleBackground={false}
    modal={true}
    {...props}
  >
    {children}
  </DrawerPrimitive.Root>
);

const UnifiedBottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    style={{ WebkitTapHighlightColor: "transparent" }}
    {...props}
  />
));
UnifiedBottomSheetOverlay.displayName = "UnifiedBottomSheetOverlay";

const UnifiedBottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPrimitive.Portal>
    <UnifiedBottomSheetOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col overflow-hidden rounded-t-lg border-0 border-t border-border bg-card outline-none",
        "focus:outline-none focus-visible:outline-none focus-visible:ring-0",
        className
      )}
      style={{
        backgroundColor: "hsl(var(--card))",
        WebkitTapHighlightColor: "transparent",
      }}
      {...props}
    >
      <div
        className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/40"
        aria-hidden
      />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPrimitive.Portal>
));
UnifiedBottomSheetContent.displayName = "UnifiedBottomSheetContent";

const UnifiedBottomSheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "sticky top-0 z-10 shrink-0 border-b border-border bg-card px-5 pb-4 pt-2",
      className
    )}
    {...props}
  />
);

const UnifiedBottomSheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4", className)} {...props} />
);

export const UnifiedBottomSheet = {
  Root: UnifiedBottomSheetRoot,
  Content: UnifiedBottomSheetContent,
  Header: UnifiedBottomSheetHeader,
  Body: UnifiedBottomSheetBody,
};
