import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const proxyTarget =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:3000"
    : "http://112.126.27.148";

console.log("NODE_ENV: ", proxyTarget);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 将 @ 映射到 src 目录
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: proxyTarget,
        //
        changeOrigin: true,
        // rewrite: path => path.replace()
      },
    },
  },
});
