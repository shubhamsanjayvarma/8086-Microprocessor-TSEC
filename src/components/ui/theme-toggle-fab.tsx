import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleFABProps {
  isDarkMode: boolean;
  toggle: () => void;
}

export function ThemeToggleFAB({ isDarkMode, toggle }: ThemeToggleFABProps) {
  return (
    <motion.button
      onClick={toggle}
      style={{
        position: "fixed",
        bottom: "32px",
        right: "32px",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid var(--glow-card-border)",
        background: "var(--glow-card-bg)",
        color: "var(--glow-text-primary)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        cursor: "pointer",
        zIndex: 50,
        outline: "none",
      }}
      whileHover={{
        scale: 1.1,
        boxShadow: "0 12px 40px 0 var(--glow-card-hover-border)",
        background: "var(--glow-card-hover-bg)",
        borderColor: "var(--glow-card-hover-border)",
      }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, y: 50, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDarkMode ? "dark" : "light"}
          initial={{ y: -30, opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          exit={{ y: 30, opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isDarkMode ? <Moon size={26} /> : <Sun size={26} />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
