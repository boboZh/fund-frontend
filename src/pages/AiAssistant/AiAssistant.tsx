import React, { useEffect } from "react";
import useStore from "@/store";
import ChatSidebar from "./components/ChatSidebar";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { generateSessionId } from "@/utils/tools";
import ChatPanel from "./components/ChatPanel";

const AiAssistant: React.FC = () => {
  const { sessionId: pathSessionId } = useParams();

  const navigate = useNavigate();

  const { sessions: allSessions, isInitialLoaded, getSessionList } = useStore();

  const onChatLoaded = (activeSessionId: string) => {
    const isFirstMessage = !allSessions.some((s) => s.sessionId === activeSessionId);
    if (isFirstMessage) {
      setTimeout(() => {
        getSessionList(true);
      }, 1500);
    }
  };

  //
  useEffect(() => {
    // 页面初始化加载的时候，获取sessionList
    if (!isInitialLoaded) {
      getSessionList();
    }
  }, [isInitialLoaded, getSessionList]);

  useEffect(() => {
    if (!isInitialLoaded) return;
    // 在聊天页面，路径上没有sessionId则生成一个并重定向
    if (!pathSessionId) {
      const newId = generateSessionId();
      navigate(`/chat/${newId}`, { replace: true });
      return;
    }
  }, [pathSessionId, isInitialLoaded, navigate]); // allSessions

  return (
    <div className="h-screen flex bg-white overflow-hidden text-gray-900">
      {/* 侧边栏 */}
      <ChatSidebar />

      {/* 主界面区域 */}
      <ChatPanel sessionId={pathSessionId} onChatLoaded={onChatLoaded} />
    </div>
  );
};

export default AiAssistant;
