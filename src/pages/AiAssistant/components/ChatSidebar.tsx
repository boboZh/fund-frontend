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
        isOpen ? "w-64" : "w-16"
      }`}
    >
      {/* 顶部控制区 */}
      <div className="flex items-center justify-between p-4 h-16">
        {/** 加上whitespace-nowrap，防止宽度变小文字换行折叠 */}
        {isOpen && (
          <h2 className="font-semibold text-gray-700 whitespace-nowrap overflow-hidden">
            历史会话
          </h2>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0 text-gray-500"
          title={isOpen ? "收起侧边栏" : "展开侧边栏"}
        >
          {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      {/* 新建对话按钮 */}
      <div
        className={`mb-4 transition-all duration-300 ${isOpen ? "px-4" : "flex justify-center"}`}
      >
        <button
          onClick={emitNewSession}
          className={`flex items-center justify-center bg-white border border-gray-200 text-gray-700 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all overflow-hidden ${
            isOpen
              ? "w-full gap-2 py-2.5 px-4 rounded-xl text-sm font-medium"
              : "w-10 h-10 rounded-xl"
          }`}
          title="新建对话"
        >
          <Plus size={18} className="flex-shrink-0" />
          {isOpen && <span className="whitespace-nowrap">新建对话</span>}
        </button>
      </div>

      {/* 会话列表 */}
      {!isInitialLoaded ? (
        <div className="flex-1 overflow-y-auto px-3 py-2 text-sm text-center  text-gray-400">
          {isOpen ? "加载中..." : "..."}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 space-y-1 overflow-x-hidden">
          {sessions?.map?.((s) => (
            <div
              key={s.sessionId}
              onClick={() => navigate(`/chat/${s.sessionId}`)}
              // 展开时左对齐长条，收起时居中正方形
              className={`group flex items-center rounded-xl cursor-pointer transition-all ${
                isOpen ? "px-3 py-2.5 gap-3" : "justify-center w-10 h-10 mx-auto"
              } ${
                curSessionId === s.sessionId
                  ? "bg-white shadow-sm ring-1 ring-gray-200 text-indigo-600"
                  : "text-gray-500 hover:bg-gray-200/60"
              }`}
              title={s.title || "新对话"}
            >
              <MessageSquare
                size={16}
                className={`flex-shrink-0 ${curSessionId === s.sessionId ? "text-indigo-600" : "text-gray-400"}`}
              />
              {/* 文字和删除按钮只在展开时渲染 */}
              {isOpen && (
                <>
                  <span className="flex-1 truncate text-sm">{s.title || "新对话"}</span>
                  <Trash2
                    size={14}
                    onClick={(e) => handleDelete(e, s.sessionId)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0"
                  />
                </>
              )}
            </div>
          )) || <div className="text-sm text-gray-400">暂无会话</div>}
        </div>
      )}

      {/* 底部用户信息 */}
      <div
        className={`p-4 border-t border-gray-200 flex ${isOpen ? "items-center gap-3" : "justify-center"}`}
      >
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
          U
        </div>
        {isOpen && (
          <span className="text-sm text-gray-600 font-medium whitespace-nowrap">我的账户</span>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
