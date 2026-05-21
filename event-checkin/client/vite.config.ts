import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawBasePath = env.VITE_BASE_PATH?.trim() || "/";
  const basePath =
    rawBasePath === "/"
      ? "/"
      : `/${rawBasePath.replace(/^\/+/, "").replace(/\/+$/, "")}/`;

  return {
    base: basePath,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true
        },
        "/event-checkin/api": {
          target: "http://localhost:3001",
          changeOrigin: true
        }
      }
    }
  };
});
