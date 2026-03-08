import { RouterProvider } from "react-router-dom";
import router from "@/router/config";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div>
      <Toaster richColors position="top-center" />
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
