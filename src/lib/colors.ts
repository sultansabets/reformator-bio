/**
 * Unified metric color system with three distinct states.
 * No gradients - clear signal-based colors only.
 */

export const METRIC_COLORS = {
  green: "#D6FF00",   // Pantone Sun Glare - excellent state
  orange: "#FF5A2E",  // Pantone Exuberant Orange - moderate state
  red: "#FF3B30",     // Brand red - poor state / overload
} as const;

export const METRIC_COLORS_RGB = {
  green: { r: 214, g: 255, b: 0 },
  orange: { r: 255, g: 90, b: 46 },
  red: { r: 255, g: 59, b: 48 },
} as const;

/**
 * Returns a color based on score (0-100) using three-tier system.
 * @param score - Value from 0 to 100
 * @param inverted - If true, treats 0 as good and 100 as bad (e.g., for load metrics)
 * @returns Hex color string
 */
export function getMetricColor(score: number, inverted = false): string {
  const effectiveScore = inverted ? 100 - score : score;
  
  if (effectiveScore >= 75) return METRIC_COLORS.green;
  if (effectiveScore >= 40) return METRIC_COLORS.orange;
  return METRIC_COLORS.red;
}

/**
 * Returns a color based on score (0-100) using three-tier system.
 * Alias for getMetricColor for compatibility.
 */
export function getMetricColorHex(score: number, inverted = false): string {
  return getMetricColor(score, inverted);
}

/**
 * Returns RGB object for canvas/WebGL rendering.
 */
export function getMetricColorRgb(score: number, inverted = false): { r: number; g: number; b: number } {
  const effectiveScore = inverted ? 100 - score : score;
  
  if (effectiveScore >= 75) return METRIC_COLORS_RGB.green;
  if (effectiveScore >= 40) return METRIC_COLORS_RGB.orange;
  return METRIC_COLORS_RGB.red;
}

/**
 * Returns RGB string for CSS.
 */
export function getMetricColorRgbString(score: number, inverted = false): string {
  const rgb = getMetricColorRgb(score, inverted);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}
