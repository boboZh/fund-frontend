import { BrowserRouter, Routes, Route } from "react-router-dom";
import PermissionGuard from "@/router/PermissionGuard";
import { routes } from "@/router/config";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div>
      <Toaster richColors position="top-center" />
      {/* basename必须和vite.config中的base一致 */}
      <BrowserRouter basename="/">
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<PermissionGuard auth={route.auth}>{route.element}</PermissionGuard>}
            />
          ))}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
