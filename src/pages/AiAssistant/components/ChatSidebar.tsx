import React, { useState } from "react";
import type { Session } from "@/types/ai";
import { PanelLeftClose, PanelLeftOpen, Plus, MessageSquare, Trash2 } from "lucide-react";
import useStore from "@/store";

const ChatSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const store = useStore();

  // 模拟数据用于演示，实际从 store 或接口获取
  const sessions = store.sessions || [];

  return (
    <div
      className={`relative h-screen flex flex-col transition-all duration-300 ease-in-out bg-[#f9f9f9] border-r border-gray-200 ${
        isOpen ? "w-64" : "w-0 overflow-hidden"
      }`}
    >
      {/* 顶部控制区 */}
      <div className="flex items-center justify-between p-4 h-16">
        {isOpen && <h2 className="font-semibold text-gray-700">历史会话</h2>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${!isOpen ? "fixed left-4 top-4 z-50 bg-white shadow-sm border" : ""}`}
        >
          {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      {/* 新建对话按钮 */}
      {isOpen && (
        <div className="px-4 mb-2">
          <button
            onClick={() => {
              /* create logic */
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
          >
            <Plus size={16} />
            新建对话
          </button>
        </div>
      )}

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => store.setCurSession(s)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all ${
              store.curSession?.id === s.id
                ? "bg-white shadow-sm ring-1 ring-gray-200 text-blue-600"
                : "text-gray-600 hover:bg-gray-200/50"
            }`}
          >
            <MessageSquare
              size={16}
              className={store.curSession?.id === s.id ? "text-blue-500" : "text-gray-400"}
            />
            <span className="flex-1 truncate">{s.title || "新对话"}</span>

            {/* 只有在悬浮时显示的删除图标 */}
            {isOpen && (
              <Trash2
                size={14}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
              />
            )}
          </div>
        ))}
      </div>

      {/* 底部用户信息（可选） */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              U
            </div>
            <span>我的账户</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
