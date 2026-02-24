import { cn } from "@/lib/utils";

export interface CenterIconProps {
  active?: boolean;
  className?: string;
}

const STROKE_INACTIVE = 1.8;
const STROKE_ACTIVE = 2.2;
const CX = 12;
const CY = 12;
const R = 10; /* 20px diameter — matches Lucide icon visual area */

/** Circle with pie-segment. Active: segment fills white. */
export function CenterIcon({ active, className }: CenterIconProps) {
  const strokeWidth = active ? STROKE_ACTIVE : STROKE_INACTIVE;
  // 90° segment: top → right (12 o'clock to 3 o'clock)
  const segmentPath = `M ${CX} ${CY} L ${CX} ${CY - R} A ${R} ${R} 0 0 1 ${CX + R} ${CY} Z`;

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-6 w-6 text-current", className)}
      aria-hidden
    >
      <g
        style={{ transformOrigin: `${CX}px ${CY}px` }}
        className={cn(
          "transition-[opacity,transform] duration-200",
          active ? "opacity-100 scale-100" : "opacity-0 scale-90"
        )}
      >
        <path d={segmentPath} fill="#FFFFFF" />
      </g>
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
