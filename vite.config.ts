import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/vistara-ir-simulation/",
  build: {
    outDir: "dist",
    sourcemap: false
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
