"use client";

import { motion } from "framer-motion";
import { CoverflowCarousel } from "./coverflow-carousel";

const EASE = [0.16, 1, 0.3, 1] as const;

const DEVELOPERS = [
  {
    name: "Shubham Varma",
    github: "shubhamsanjayvarma",
    role: "Developer",
  },
  {
    name: "Pratik Yadav",
    github: "pratikforge",
    role: "Developer",
  },
  {
    name: "Piyush Tiwari",
    github: "tiwaripiyush140-glitch",
    role: "Developer",
  },
  {
    name: "Tarak Desai",
    github: "tarakdesai19",
    role: "Developer",
  },
];

export default function DeveloperProfiles() {
  const slides = DEVELOPERS.map((dev) => ({
    src: `https://github.com/${dev.github}.png`,
    alt: dev.name,
    title: dev.name,
    subtitle: dev.role,
    meta: [{ label: "GitHub", value: `@${dev.github}` }],
    href: `https://github.com/${dev.github}`,
  }));

  return (
    <section
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle top glow to connect visually with hero */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, var(--glow-text-accent), transparent)",
        }}
      />

      <motion.h2
        style={{
          color: "var(--glow-text-primary)",
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          fontWeight: 600,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          letterSpacing: "-0.02em",
          marginBottom: "12px",
          textAlign: "center",
        }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        Meet the{" "}
        <span style={{ color: "var(--glow-text-accent)" }}>Developers</span>
      </motion.h2>

      <motion.p
        style={{
          color: "#888",
          fontSize: "1rem",
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          textAlign: "center",
          marginBottom: "60px",
          maxWidth: "500px",
        }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
      >
        Built with passion for TSEC
      </motion.p>

      <div style={{ width: "100%", maxWidth: "800px" }}>
        <CoverflowCarousel
          slides={slides}
          showCaption
          showNavigation
          showPagination
          loop
        />
      </div>
    </section>
  );
}
