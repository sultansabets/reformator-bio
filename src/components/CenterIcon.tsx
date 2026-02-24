import { cn } from "@/lib/utils";

export interface CenterIconProps {
  active?: boolean;
  className?: string;
}

/** 4 squares 2x2 grid — Windows-style. Active: top-left white, others gray. */
export function CenterIcon({ active, className }: CenterIconProps) {
  const base = "transition-colors duration-200";
  const gray = "fill-muted-foreground";
  const white = "fill-white";

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-6 w-6", className)}
      aria-hidden
    >
      <rect
        x={0}
        y={0}
        width={11}
        height={11}
        rx={1}
        className={cn(base, active ? white : gray)}
      />
      <rect
        x={13}
        y={0}
        width={11}
        height={11}
        rx={1}
        className={cn(base, gray)}
      />
      <rect
        x={0}
        y={13}
        width={11}
        height={11}
        rx={1}
        className={cn(base, gray)}
      />
      <rect
        x={13}
        y={13}
        width={11}
        height={11}
        rx={1}
        className={cn(base, gray)}
      />
    </svg>
  );
}
