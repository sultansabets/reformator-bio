import React from "react";
import {
  HiOutlineHome,
  HiHome,
  HiOutlineChartBar,
  HiChartBar,
  HiOutlineBeaker,
  HiBeaker,
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

export function StatsOutlineIcon({ className }: { className?: string }) {
  return <HiOutlineChartBar className={cn(iconClassName, className)} strokeWidth={1.8} />;
}

export function StatsFilledIcon({ className }: { className?: string }) {
  return <HiChartBar className={cn(iconClassName, className)} />;
}

export function LabsOutlineIcon({ className }: { className?: string }) {
  return <HiOutlineBeaker className={cn(iconClassName, className)} strokeWidth={1.8} />;
}

export function LabsFilledIcon({ className }: { className?: string }) {
  return <HiBeaker className={cn(iconClassName, className)} />;
}

export function ProfileOutlineIcon({ className }: { className?: string }) {
  return <HiOutlineUser className={cn(iconClassName, className)} strokeWidth={1.8} />;
}

export function ProfileFilledIcon({ className }: { className?: string }) {
  return <HiUser className={cn(iconClassName, className)} />;
}
