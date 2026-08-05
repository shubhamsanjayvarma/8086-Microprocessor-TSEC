"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export function AnimatedTitleFM({ open }: { open?: boolean }) {
  if (!open) return null;

  return (
    <div style={{ textAlign: "center", zIndex: 10 }}>
      <motion.h1
        style={{
          fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
          fontWeight: 600,
          color: "var(--glow-text-primary)",
          margin: 0,
          lineHeight: 1.2,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          letterSpacing: "-0.02em",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.8 }}
      >
        Welcome to the
      </motion.h1>
      <motion.h1
        style={{
          fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
          fontWeight: 600,
          color: "var(--glow-text-accent)",
          margin: 0,
          lineHeight: 1.2,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          letterSpacing: "-0.02em",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: EASE, delay: 1.0 }}
      >
        8086 Emulator
      </motion.h1>
    </div>
  );
}
