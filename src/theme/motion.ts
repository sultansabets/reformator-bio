/**
 * Global motion tokens – standardized animation timing and easing.
 * Use these values across the app for a consistent, premium feel.
 */

export const motion = {
  /** 120ms – quick feedback (hover, press, nav icon) */
  fast: 0.12,
  /** 200ms – standard transitions (page enter, color) */
  normal: 0.2,
  /** 320ms – slower transitions (modals, expand) */
  slow: 0.32,

  /** Primary ease – smooth decelerate (most UI) */
  easePrimary: [0.22, 1, 0.36, 1] as const,
  /** Secondary ease – standard material (fallback) */
  easeSecondary: [0.4, 0, 0.2, 1] as const,

  /** CSS cubic-bezier strings */
  easePrimaryCss: "cubic-bezier(0.22, 1, 0.36, 1)",
  easeSecondaryCss: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/** Page enter: opacity 0→1, y 10→0, 200ms */
export const pageEnter = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: motion.normal, ease: motion.easePrimary },
};

/** Page exit: opacity 1→0, y 0→-10, 160ms */
export const pageExit = {
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.16, ease: motion.easeSecondary },
};

/** Card enter: opacity 0→1, y 8→0, 180ms */
export const cardEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, ease: motion.easePrimary },
};

/** Nav icon active scale: 1→1.05, 120ms */
export const navIconActive = {
  scale: 1.05,
  transition: { type: "spring" as const, stiffness: 400, damping: 25 },
};

/** Hover: scale 1.02, 120ms */
export const hoverScale = {
  scale: 1.02,
  transition: { duration: motion.fast, ease: motion.easePrimary },
};

/** Press: scale 0.97, 120ms */
export const pressScale = {
  scale: 0.97,
  transition: { duration: motion.fast, ease: motion.easePrimary },
};
