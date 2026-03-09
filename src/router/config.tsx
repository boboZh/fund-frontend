import FundDashboard from "@/pages/FundDashboard/FundDashboard";
import Login from "@/pages/Login/Login";
// import Home from "@/pages/Home/Home";
import AiAssistant from "@/pages/AiAssistant/AiAssistant";
import AudioDemo from "@/pages/AudioDemo/AudioDemo";
import ChunkUpload from "@/pages/Upload/ChunkUpload";
import ImageToVideo from "@/pages/ImageToVideo/ImageToVideo";

import { createBrowserRouter, type RouteObject, createMemoryRouter } from "react-router-dom";
import PermissionGuard from "./PermissionGuard";
import MainLayout from "@/components/layout/MainLayout";

const withGuard = (element: React.ReactElement, auth: boolean) => {
  return <PermissionGuard auth={auth}>{element}</PermissionGuard>;
};

export const routes: RouteObject[] = [
  {
    path: "/login",
    element: withGuard(<Login />, false),
  },
  {
    path: "/",
    element: withGuard(<MainLayout />, true),
    children: [
      {
        index: true,
        path: "/", //fund-dashboard
        element: <FundDashboard />,
      },
      //   {
      //     path: "/",
      //     element: <Home />,
      //     auth: true,
      //   },
      {
        path: "/chat/:sessionId?",
        element: <AiAssistant />,
      },
      {
        path: "/audio",
        element: <AudioDemo />,
      },
      {
        path: "/upload",
        element: <ChunkUpload />,
      },
      {
        path: "/image-to-video",
        element: <ImageToVideo />,
      },
    ],
  },
];
const router =
  typeof document !== "undefined"
    ? createBrowserRouter(routes, {
        basename: "/",
      })
    : createMemoryRouter(routes, { initialEntries: ["/"] });

export default router;
