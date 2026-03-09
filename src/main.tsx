import { StrictMode } from "react";
// 🌟 1. 改为引入 hydrateRoot
import { hydrateRoot, createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// 🌟 2. 加上环境判断，确保这段代码绝对不会在 Node.js (服务端) 执行
if (typeof document !== "undefined") {
  const container = document.getElementById("root")!;

  // 🌟 3. 判断一下：如果容器里面已经有 HTML 内容了（说明经历过 SSR），就注水接管
  // 如果容器是空的（比如降级到了 CSR 纯客户端渲染），就正常挂载
  if (container.hasChildNodes()) {
    hydrateRoot(
      container,
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } else {
    createRoot(container).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
}
