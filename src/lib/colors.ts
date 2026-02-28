/**
 * Unified metric color system using linear interpolation.
 * Red (#ff3b30) at 0% → Green (#34c759) at 100%.
 * No fixed thresholds - smooth gradient only.
 */

const RED = { r: 255, g: 59, b: 48 };   // #ff3b30
const GREEN = { r: 52, g: 199, b: 89 }; // #34c759

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/**
 * Returns a color based on score (0-100) with linear interpolation.
 * @param score - Value from 0 to 100
 * @param inverted - If true, treats 0 as good and 100 as bad (e.g., for load metrics)
 * @returns RGB color string
 */
export function getMetricColor(score: number, inverted = false): string {
  const clamped = Math.max(0, Math.min(100, score));
  const t = (inverted ? 100 - clamped : clamped) / 100;

  const r = lerp(RED.r, GREEN.r, t);
  const g = lerp(RED.g, GREEN.g, t);
  const b = lerp(RED.b, GREEN.b, t);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Returns a hex color based on score (0-100) with linear interpolation.
 * @param score - Value from 0 to 100
 * @param inverted - If true, treats 0 as good and 100 as bad (e.g., for load metrics)
 * @returns Hex color string
 */
export function getMetricColorHex(score: number, inverted = false): string {
  const clamped = Math.max(0, Math.min(100, score));
  const t = (inverted ? 100 - clamped : clamped) / 100;

  const r = lerp(RED.r, GREEN.r, t);
  const g = lerp(RED.g, GREEN.g, t);
  const b = lerp(RED.b, GREEN.b, t);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
