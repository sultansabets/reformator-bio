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

/** 90° segment: top → right (12 o'clock to 3 o'clock) */
const SEGMENT_PATH = `M ${CX} ${CY} L ${CX} ${CY - R} A ${R} ${R} 0 0 1 ${CX + R} ${CY} Z`;

/** Circle with pie-segment. Active: segment white. Inactive: segment gray. */
export function CenterIcon({ active, className }: CenterIconProps) {
  const strokeWidth = active ? STROKE_ACTIVE : STROKE_INACTIVE;

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-6 w-6 text-current", className)}
      aria-hidden
    >
      <path
        d={SEGMENT_PATH}
        className={cn(
          "transition-colors duration-200",
          active ? "fill-white" : "fill-muted-foreground"
        )}
      />
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted-foreground"
      />
    </svg>
  );
}
