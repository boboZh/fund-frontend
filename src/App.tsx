import React from "react";
// import router from './router/config'; ❌ 把这行静态引入删掉！
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner"; // 或者你引入的路径

// 🌟 接收 router 作为参数
function App({ router }: { router: any }) {
  return (
    <div>
      <Toaster />
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
