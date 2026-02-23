import React, { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen, Plus, MessageSquare, Trash2 } from "lucide-react";
import useStore from "@/store";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { generateSessionId } from "@/utils/tools";

const ChatSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const { sessionId: curSessionId } = useParams();

  // const store = useStore(); // 不要全量订阅，容易污染组件环境

  const { sessions, deleteSession, isInitialLoaded, getSessionList } = useStore();

  useEffect(() => {
    if (!isInitialLoaded) getSessionList();
  }, [isInitialLoaded, getSessionList]);

  const handleDelete = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    try {
      const nextSessions = await deleteSession(sid);

      if (sid === curSessionId) {
        if (nextSessions.length > 0) {
          navigate(`/chat/${nextSessions[0].sessionId}`);
        } else {
          navigate("/chat/new");
        }
      }
    } catch (err) {
      toast.error("删除失败" + (err instanceof Error ? err.message : ""));
    }
  };
  // 创建新会话
  const emitNewSession = () => {
    const newSessionId = generateSessionId();
    navigate(`/chat/${newSessionId}`);
  };

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
            onClick={emitNewSession}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
          >
            <Plus size={16} />
            新建对话
          </button>
        </div>
      )}

      {/* 会话列表 */}
      {!isInitialLoaded ? (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 text-sm text-center ">
          加载会话列表...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {sessions.map((s) => (
            <div
              key={s.sessionId}
              onClick={() => navigate(`/chat/${s.sessionId}`)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all ${
                curSessionId === s.sessionId
                  ? "bg-white shadow-sm ring-1 ring-gray-200 text-blue-600"
                  : "text-gray-600 hover:bg-gray-200/50"
              }`}
            >
              <MessageSquare
                size={16}
                className={curSessionId === s.sessionId ? "text-blue-500" : "text-gray-400"}
              />
              <span className="flex-1 truncate">{s.title || "新对话"}</span>

              {/* 只有在悬浮时显示的删除图标 */}
              {isOpen && (
                <Trash2
                  size={14}
                  onClick={(e) => handleDelete(e, s.sessionId)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                />
              )}
            </div>
          ))}
        </div>
      )}

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
