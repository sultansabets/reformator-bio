import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

const LOGO_SHOW_MS = 1200;
const FADEOUT_MS = 400;

export default function SplashScreen() {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const fadeOutAt = LOGO_SHOW_MS;
    const hideAt = fadeOutAt + FADEOUT_MS;
    const startFade = setTimeout(() => setOpacity(0), fadeOutAt);
    const hide = setTimeout(() => setVisible(false), hideAt);
    return () => {
      clearTimeout(startFade);
      clearTimeout(hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background transition-colors duration-300 transition-opacity duration-500"
      style={{ opacity }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={theme === "dark" ? logoDark : logoLight}
            alt="Reformator Bio Logo"
            className="h-20 w-auto object-contain transition-opacity duration-500 md:h-24"
          />
          <div
            className="pointer-events-none absolute inset-0 w-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent dark:via-white/10"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
