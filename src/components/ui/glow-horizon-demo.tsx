import GlowHorizonFM from "./glow-horizon";
import { AnimatedTitleFM } from "./glow-horizon-utils/animated-title-fm";

export default function GlowHorizonDemo({
  isDarkMode = true,
}: {
  isDarkMode?: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <div className="animate-float-droplet absolute inset-0 w-full h-full pointer-events-none">
        {/* The key prop forces the component to remount and replay entrance animations on theme switch */}
        <GlowHorizonFM key={isDarkMode ? "dark" : "light"} variant="top" />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Same here for the title animation */}
        <AnimatedTitleFM key={isDarkMode ? "dark" : "light"} open={true} />
      </div>
    </div>
  );
}
