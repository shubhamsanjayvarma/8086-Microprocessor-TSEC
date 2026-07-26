import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base:
    process.env.GITHUB_PAGES === "true" ? "/8086-Microprocessor-TSEC/" : "/",
  plugins: [react()],
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "jsdom",
  },
});
