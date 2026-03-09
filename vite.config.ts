import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const proxyTarget =
  process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : "http://112.126.27.148";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 将 @ 映射到 src 目录
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 🌟 新增：SSR 相关配置
  ssr: {
    // 如果你有某些库只在浏览器运行（比如带有 window 对象的），需要在这里排除
    // 对于你的项目，通常 react-router-dom 和 zustand 没问题
    noExternal: ["lucide-react", "sonner"], // 确保这些库被打包进 SSR Bundle 中，防止 Node.js 无法识别 ESM
  },
  build: {
    // 生产环境打包配置
    rollupOptions: {
      // 如果是客户端打包，入口是 index.html
      // 如果是服务端打包，Vite 命令行会通过 --ssr 指定入口，这里可以不写死
    },
  },
  optimizeDeps: {
    //@ffmpeg/ffmpeg 内部动态调用了 Web Worker，Vite 的预构建工具没有正确处理这个 Worker 文件的路径，导致浏览器去 .vite/deps/ 下找 worker.js 时找不到。
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/utils"],
  },
  server: {
    //   FFmpeg.wasm 在现代浏览器中运行通常需要多线程支持，这依赖于 SharedArrayBuffer。
    // 为了启用它，必须在服务器响应头中添加跨域隔离（Cross-Origin Isolation）标头。
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
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
