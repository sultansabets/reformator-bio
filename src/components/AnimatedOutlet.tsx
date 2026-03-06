import { useOutlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { pageEnter, pageExit } from "@/theme/motion";

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {outlet && (
        <motion.div
          key={location.pathname}
          initial={pageEnter.initial}
          animate={pageEnter.animate}
          exit={pageExit.exit}
          transition={{
            duration: pageEnter.transition.duration,
            ease: pageEnter.transition.ease,
          }}
          className="flex flex-1 flex-col min-h-0"
        >
          {outlet}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
