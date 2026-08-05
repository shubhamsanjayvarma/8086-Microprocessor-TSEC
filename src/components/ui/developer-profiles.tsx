"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

const DEVELOPERS = [
  {
    name: "Shubham Varma",
    github: "shubhamsanjayvarma",
    role: "Lead Developer",
  },
  {
    name: "Pratik Yadav",
    github: "pratikforge",
    role: "Core Contributor",
  },
  {
    name: "Piyush Tiwari",
    github: "tiwaripiyush140-glitch",
    role: "Core Contributor",
  },
  {
    name: "Tarak Desai",
    github: "tarakdesai19",
    role: "Core Contributor",
  },
];

export default function DeveloperProfiles() {
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(220px, 320px))",
          justifyContent: "center",
          gap: "32px",
          width: "100%",
          maxWidth: "960px",
        }}
      >
        {DEVELOPERS.map((dev, i) => (
          <motion.a
            key={dev.github}
            href={`https://github.com/${dev.github}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              padding: "32px 20px",
              borderRadius: "16px",
              background: "var(--glow-card-bg)",
              border: "1px solid var(--glow-card-border)",
              textDecoration: "none",
              transition: "background 0.3s, border-color 0.3s",
            }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE, delay: i * 0.12 }}
            whileHover={{
              scale: 1.04,
              transition: { duration: 0.2 },
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--glow-card-hover-bg)";
              e.currentTarget.style.borderColor =
                "var(--glow-card-hover-border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--glow-card-bg)";
              e.currentTarget.style.borderColor = "var(--glow-card-border)";
            }}
          >
            <img
              src={`https://github.com/${dev.github}.png`}
              alt={dev.name}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "2px solid var(--glow-card-hover-border)",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "var(--glow-text-accent)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                }}
              >
                {dev.name}
              </div>
              <div
                style={{
                  color: "#666",
                  fontSize: "0.85rem",
                  marginTop: "4px",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                }}
              >
                {dev.role}
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
