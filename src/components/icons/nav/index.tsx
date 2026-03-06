import React from "react";
import {
  HiOutlineHome,
  HiHome,
  HiOutlineSquares2X2,
  HiSquares2X2,
  HiOutlineChartBar,
  HiChartBar,
  HiOutlineUser,
  HiUser,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";

const iconClassName = "h-6 w-6 shrink-0";

export function HomeOutlineIcon({ className }: { className?: string }) {
  return <HiOutlineHome className={cn(iconClassName, className)} strokeWidth={1.8} />;
}

export function HomeFilledIcon({ className }: { className?: string }) {
  return <HiHome className={cn(iconClassName, className)} />;
}

export function CenterOutlineIcon({ className }: { className?: string }) {
  return <HiOutlineSquares2X2 className={cn(iconClassName, className)} strokeWidth={1.8} />;
}

export function CenterFilledIcon({ className }: { className?: string }) {
  return <HiSquares2X2 className={cn(iconClassName, className)} />;
}

export function AnalysesOutlineIcon({ className }: { className?: string }) {
  return <HiOutlineChartBar className={cn(iconClassName, className)} strokeWidth={1.8} />;
}

export function AnalysesFilledIcon({ className }: { className?: string }) {
  return <HiChartBar className={cn(iconClassName, className)} />;
}

export function ProfileOutlineIcon({ className }: { className?: string }) {
  return <HiOutlineUser className={cn(iconClassName, className)} strokeWidth={1.8} />;
}

export function ProfileFilledIcon({ className }: { className?: string }) {
  return <HiUser className={cn(iconClassName, className)} />;
}
