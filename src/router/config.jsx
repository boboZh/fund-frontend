import FundDashboard from "@/pages/FundDashboard/FundDashboard";
import Login from "@/pages/Login/Login";
import Home from "@/pages/Home/Home";
import AiAssistant from "@/pages/AiAssistant/AiAssistant"; // 假设的新页面

export const routes = [
  {
    path: "/login",
    element: <Login />,
    auth: false, // 不需要登录
  },
  {
    path: "/fund-dashboard",
    element: <FundDashboard />,
    auth: true, // 需要登录
  },
  {
    path: "/",
    element: <Home />,
    auth: true,  
  }, 
  {
    path: '/chat/:sessionId?',
    element: <AiAssistant />,
    auth: true
  }
];
