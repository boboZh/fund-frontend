import {
  PanelLeftOpen,
  PanelLeftClose,
  User,
  LayoutDashboard,
  Bot,
  Music,
  Code,
  Upload,
  LogOut,
} from "lucide-react";
import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { apiLogout } from "@/apis/user.api";
import useStore from "@/store";
import { useNavigate } from "react-router-dom";

const MainLayout: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const { setLogout } = useStore();
  const menus = [
    // { name: "首页", path: "/", icon: Home },
    { name: "基金看板", path: "/", icon: LayoutDashboard },
    { name: "AI 助手", path: "/chat", icon: Bot }, // 或者是 /chat，看你的路由配置
    { name: "音频 Demo", path: "/audio", icon: Music },
    // { name: "富文本", path: "/editor", icon: FileText },
    { name: "分片上传", path: "/upload", icon: Upload },
    { name: "图片转视频", path: "/image-to-video", icon: Code },
  ];

  const handleLogout = () => {
    toast("确定要退出登录吗？", {
      description: "退出后要重新输入账号密码",
      position: "top-center",
      action: {
        label: "确定退出",
        onClick: async () => {
          try {
            await apiLogout();
            toast.success("已安全退出登录");
            setLogout();
            navigate("/login", { replace: true });
          } catch (e) {
            console.error("登出error：", e);
            toast.error("操作失败");
          }
        },
      },
      cancel: {
        label: "取消",
        onClick: () => {},
      },
      duration: 5000,
    });
  };
  return (
    <div className="flex h-screen w-screen bg-white tex-gray-900 overflow-hidden">
      {/* 全局侧边栏 */}
      <aside
        className={`relative h-screen flex flex-col transition-all duration-300 ease-in-out bg-[#f9f9f9] border-r border-gray-200 z-10 ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex items-center justify-between p-4 h-16">
          {isOpen && (
            <h2 className="font-bold text-gray-800 whitespace-nowrap overflow-hidden">
              前端工具箱
            </h2>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0 text-gray-500"
            title={isOpen ? "收起导航" : "展开导航"}
          >
            {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        </div>
        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1 overflow-x-hidden">
          {menus.map((menu) => {
            const Icon = menu.icon;
            return (
              <NavLink
                key={menu.path}
                to={menu.path}
                className={({ isActive }) =>
                  `group flex items-center rounded-xl cursor-pointer transition-all ${
                    isOpen ? "px-3 py-2.5 gap-3" : "justify-center w-10 h-10 mx-auto"
                  } ${
                    isActive
                      ? // 激活状态：使用你项目里的白底、ring阴影和靛蓝文字
                        "bg-white shadow-sm ring-1 ring-gray-200 text-indigo-600"
                      : // 未激活状态：灰字，hover 浅灰底色
                        "text-gray-500 hover:bg-gray-200/60"
                  }`
                }
                title={menu.name}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={`flex-shrink-0 ${isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}`}
                    />
                    {isOpen && (
                      <span className="flex-1 truncate text-sm font-medium">{menu.name}</span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        {/* 底部用户信息区 */}
        <div
          className={`p-4 border-t border-gray-200 flex ${
            isOpen ? "items-center justify-between" : "justify-center"
          }`}
        >
          {/* 左侧：头像和昵称 */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 transition-colors"
              // 折叠状态下，头像变成可点击的登出按钮
              style={{ cursor: !isOpen ? "pointer" : "default" }}
              title={!isOpen ? "点击退出登录" : ""}
              onClick={!isOpen ? handleLogout : undefined}
            >
              <User size={16} />
            </div>

            {isOpen && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="text-sm text-gray-700 font-medium truncate w-28">我的账户</span>
              </div>
            )}
          </div>

          {/* 右侧：登出按钮 (仅在展开时显示) */}
          {isOpen && (
            <button
              onClick={handleLogout}
              // 交互细节：默认灰色，hover 变成红色，并带浅红色底色
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>
      {/* 右侧主内容区 */}
      <main className="flex-1 overflow-hidden flex flex-col bg-white">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
