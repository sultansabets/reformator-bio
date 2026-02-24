import { cn } from "@/lib/utils";

export interface CenterIconProps {
  active?: boolean;
  className?: string;
}

const STROKE_INACTIVE = 1.8;
const STROKE_ACTIVE = 2.2;

/** 4 squares 2x2 grid, stroke-only. Active: top-left filled white, others outline only. */
export function CenterIcon({ active, className }: CenterIconProps) {
  const strokeWidth = active ? STROKE_ACTIVE : STROKE_INACTIVE;
  const transition = "transition-[fill] duration-200";

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-6 w-6 text-current", className)}
      aria-hidden
    >
      <rect
        x={0}
        y={0}
        width={11}
        height={11}
        rx={1}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className={cn(transition, active ? "fill-white" : "fill-none")}
      />
      <rect
        x={13}
        y={0}
        width={11}
        height={11}
        rx={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <rect
        x={0}
        y={13}
        width={11}
        height={11}
        rx={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <rect
        x={13}
        y={13}
        width={11}
        height={11}
        rx={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}
