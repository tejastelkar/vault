"use client";

import { WifiOffIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function ConnectivityBanner({ isOnline }: { isOnline: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="vault-connectivity-banner system-motion"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          role="status"
        >
          <WifiOffIcon aria-hidden="true" />
          <span>You’re offline. Saved items remain available; changes require a connection.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
