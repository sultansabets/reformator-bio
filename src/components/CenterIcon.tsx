import { cn } from "@/lib/utils";

export interface CenterIconProps {
  active?: boolean;
  className?: string;
}

const STROKE_INACTIVE = 1.8;
const STROKE_ACTIVE = 2.2;
const CX = 12;
const CY = 12;
const R = 10;

/** Equilateral triangle pointing up, centered in circle. */
const TRIANGLE_PATH = "M 12 5 L 6 15.5 L 18 15.5 Z";

/** Circle with inner triangle. Active: triangle fills white. */
export function CenterIcon({ active, className }: CenterIconProps) {
  const strokeWidth = active ? STROKE_ACTIVE : STROKE_INACTIVE;

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-6 w-6 text-current", className)}
      aria-hidden
    >
      <path
        d={TRIANGLE_PATH}
        className={cn(
          "transition-colors duration-200",
          active ? "fill-white" : "fill-current"
        )}
      />
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}
