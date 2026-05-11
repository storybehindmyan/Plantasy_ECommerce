import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/Admin-plantasy/",
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: mode === "development" ? "dist" : "../../dist/Admin-plantasy",
    emptyOutDir: true,
  },
  plugins: [react()],  // ✅ Clean: only React plugin
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
