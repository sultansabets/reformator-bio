/**
 * Global design tokens – strict color palette.
 * All UI elements must use these tokens instead of hardcoded colors.
 *
 * Base UI:
 * - Backgrounds → white / lightGray
 * - Cards → white
 * - Borders → gray
 * - Secondary text → darkGray
 * - Primary text → black
 *
 * Metrics / health indicators:
 * - good → green
 * - okay → gray
 * - bad → red
 */

export const colors = {
  // Base UI
  black: "#000000",
  darkGray: "#6F6F6F",
  gray: "#DDDDDD",
  lightGray: "#F6F6F6",
  white: "#FCFCFC",

  // Alias for Tailwind ui.*
  ui: {
    black: "#000000",
    dark: "#6F6F6F",
    gray: "#DDDDDD",
    light: "#F6F6F6",
    white: "#FCFCFC",
  },

  // State colors (metrics / health indicators only)
  state: {
    good: "#3FB37F",
    okay: "#7A7A7A",
    bad: "#EF3B3B",
  },
} as const;

/** Light theme palette – use for .light */
export const lightTheme = {
  background: "#FCFCFC",
  card: "#FFFFFF",
  textPrimary: "#000000",
  textSecondary: "#6F6F6F",
  border: "#DDDDDD",
  surface: "#F6F6F6",
} as const;

/** Dark theme palette – use for .dark */
export const darkTheme = {
  background: "#0C0C0C",
  card: "#1D1D1D",
  textPrimary: "#EDEDED",
  textSecondary: "#6F6F6F",
  border: "#353535",
  surface: "#1D1D1D",
} as const;

/** Particle orb colors – theme-aware for visibility */
export const orbParticleColors = {
  light: "#00AA66",
  dark: "#00ff88",
} as const;
