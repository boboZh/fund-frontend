import React from "react";
import { renderToString } from "react-dom/server";
import { createMemoryRouter } from "react-router-dom";
import App from "./App"; // 👈 引入 App
import { routes } from "./router/config";

export function render(url: string) {
  // 现场捏一个服务端路由
  const serverRouter = createMemoryRouter(routes, {
    initialEntries: [url],
  });

  const html = renderToString(
    <React.StrictMode>
      <App router={serverRouter} /> {/* 🌟 服务端也渲染 App，喂入 serverRouter */}
    </React.StrictMode>,
  );

  return { html };
}
