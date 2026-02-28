/**
 * Unified metric color system with three distinct states.
 * Gray scale for low/medium, green for high performance.
 */

export const METRIC_COLORS = {
  dark: "#28282B",    // 0-35% - low state
  light: "#C0C0C0",   // 35-70% - moderate state
  green: "#D9FF00",   // 70-100% - excellent state
  success: "#D9FF00", // alias for green
} as const;

/**
 * System red for critical UI elements only:
 * - Errors
 * - Delete actions
 * - Logout
 * - Missed items
 * - Destructive warnings
 */
export const SYSTEM_RED = "#770101";

export const METRIC_COLORS_RGB = {
  dark: { r: 40, g: 40, b: 43 },
  light: { r: 192, g: 192, b: 192 },
  green: { r: 217, g: 255, b: 0 },
} as const;

/**
 * Returns a color based on score (0-100) using three-tier system.
 * @param score - Value from 0 to 100
 * @param inverted - If true, treats 0 as good and 100 as bad (e.g., for load metrics)
 * @returns Hex color string
 */
export function getMetricColor(score: number, inverted = false): string {
  const effectiveScore = inverted ? 100 - score : score;
  
  if (effectiveScore < 35) return METRIC_COLORS.dark;
  if (effectiveScore < 70) return METRIC_COLORS.light;
  return METRIC_COLORS.green;
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
  
  if (effectiveScore < 35) return METRIC_COLORS_RGB.dark;
  if (effectiveScore < 70) return METRIC_COLORS_RGB.light;
  return METRIC_COLORS_RGB.green;
}

/**
 * Returns RGB string for CSS.
 */
export function getMetricColorRgbString(score: number, inverted = false): string {
  const rgb = getMetricColorRgb(score, inverted);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}
