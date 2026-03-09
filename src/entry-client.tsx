import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./App"; // 👈 引入 App
import router from "./router/config"; // 👈 引入客户端的 Router
import "./index.css";

hydrateRoot(
  document.getElementById("root")!,
  <React.StrictMode>
    <App router={router} /> {/* 🌟 客户端渲染 App，喂入 clientRouter */}
  </React.StrictMode>,
);
