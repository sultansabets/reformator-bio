/**
 * Metric color system – uses design tokens from theme.
 * Maps score (0–100) to state colors: good, okay, bad.
 */

import { colors } from "@/theme/colors";

export const METRIC_COLORS = {
  dark: colors.state.bad,    // 0–35% – bad
  light: colors.state.okay,  // 35–70% – okay
  green: colors.state.good,  // 70–100% – good
  success: colors.state.good,
} as const;

export const SYSTEM_RED = colors.state.bad;

export const METRIC_COLORS_RGB = {
  dark: hexToRgb(colors.state.bad),
  light: hexToRgb(colors.state.okay),
  green: hexToRgb(colors.state.good),
} as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

/**
 * Load-specific 3-color system: gray (no activity), green (normal), red (overload).
 * 0 → gray, 1–60 → green, 61–100 → red
 */
export function getLoadColor(load: number): string {
  const clamped = Math.min(100, Math.max(0, Math.round(load)));
  if (clamped === 0) return colors.ui.gray;
  if (clamped <= 60) return colors.state.good;
  return colors.state.bad;
}

/**
 * Returns a color based on score (0–100) using state colors.
 * @param score - Value from 0 to 100
 * @param inverted - If true, treats 0 as good and 100 as bad (e.g., for load metrics)
 */
export function getMetricColor(score: number, inverted = false): string {
  const effectiveScore = inverted ? 100 - score : score;

  if (effectiveScore < 35) return colors.state.bad;
  if (effectiveScore < 70) return colors.state.okay;
  return colors.state.good;
}

export function getMetricColorHex(score: number, inverted = false): string {
  return getMetricColor(score, inverted);
}

export function getMetricColorRgb(
  score: number,
  inverted = false
): { r: number; g: number; b: number } {
  const effectiveScore = inverted ? 100 - score : score;

  if (effectiveScore < 35) return METRIC_COLORS_RGB.dark;
  if (effectiveScore < 70) return METRIC_COLORS_RGB.light;
  return METRIC_COLORS_RGB.green;
}

export function getMetricColorRgbString(
  score: number,
  inverted = false
): string {
  const rgb = getMetricColorRgb(score, inverted);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}
