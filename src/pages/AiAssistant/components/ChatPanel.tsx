import React, { useState, useRef, useCallback, useEffect } from "react";
import { Send, Bot, Copy, Loader2 } from "lucide-react";
import AiResponse from "./AiResponse";
import useStore from "@/store";
import { apiGetMsgList } from "@/apis/ai.api";
import useChatStream from "@/hooks/useChatStream";
import { toast } from "sonner";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"; // 🌟 引入虚拟列表核心

interface ChatPanelProps {
  sessionId: string | undefined;
  onChatLoaded: (sessionId: string) => void;
  headerSlot?: React.ReactNode;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, onChatLoaded, headerSlot }) => {
  const { user, sessions: allSessions, isInitialLoaded } = useStore();

  // 🌟 只需要这一个 Ref 来控制虚拟列表
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const currentSessionIdRef = useRef<string | undefined>(undefined);

  const { input, messages, setInput, setMessages, handleSend, isLoading, stopChat } = useChatStream(
    sessionId,
    onChatLoaded,
  );

  // 消息记录分页
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const curSession = allSessions.find((s) => s.sessionId === sessionId) || null;

  // 🌟 极度清爽的加载逻辑：不需要算高度了，Virtuoso 会自动锚定滚动位置！
  const loadChatHistory = useCallback(
    async (sid: string, targetPage: number) => {
      if (targetPage === 1) setIsFetchingMore(false);

      try {
        const result = await apiGetMsgList({
          sessionId: sid,
          page: targetPage,
          pageSize: 15,
        });
        const newList = result.data.list;
        const more = result.data.hasMore;

        setMessages((prev) => {
          // 直接将新数据拼在前面，Virtuoso 底层会自动处理滚动条锚定，不会出现闪烁！
          return targetPage === 1 ? newList : [...newList, ...prev];
        });
        setHasMore(more);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "获取对话历史失败");
      } finally {
        setIsFetchingMore(false);
      }
    },
    [setMessages],
  );

  useEffect(() => {
    if (!isInitialLoaded) return;
    if (sessionId !== currentSessionIdRef.current) {
      currentSessionIdRef.current = sessionId;
      setPage(1);
      setHasMore(true);
      setInput("");

      if (sessionId) {
        const validSession = allSessions.find((s) => s.sessionId === sessionId);
        if (validSession) {
          loadChatHistory(sessionId, 1);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }
  }, [sessionId, loadChatHistory, setMessages, allSessions, setInput, isInitialLoaded]);

  // 🌟 触顶加载更多事件
  const loadMoreHistory = useCallback(() => {
    if (hasMore && !isFetchingMore && sessionId) {
      setIsFetchingMore(true);
      const nextPage = page + 1;
      loadChatHistory(sessionId, nextPage).then(() => {
        setPage(nextPage);
      });
    }
  }, [hasMore, isFetchingMore, sessionId, page, loadChatHistory]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  useEffect(() => {
    return () => stopChat();
  }, [stopChat]);

  return (
    <div className="flex-1 flex flex-col relative bg-white h-full overflow-hidden">
      {/* 1. 顶部 Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white/80 backdrop-blur-md z-10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-800">AI 策略助手</h1>
          </div>
          <div className="text-center text-sm text-gray-400 font-medium uppercase tracking-wider flex-1">
            {curSession?.title || ""}
          </div>
        </div>
        {headerSlot}
      </header>

      {/* 2. 消息展示区 - 🌟 使用 Virtuoso 接管 */}
      <main className="flex-1 bg-[#fafafa] relative h-full">
        {/* 将全局 Loading 悬浮在顶部 */}
        {isFetchingMore && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex justify-center py-1.5 px-4 bg-white/90 rounded-full shadow-sm backdrop-blur-sm border border-gray-100">
            <Loader2 className="animate-spin text-indigo-500 w-4 h-4" />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center pb-20">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
              <Bot size={32} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              下午好，{user?.nickname || "朋友"}
            </h2>
            <p className="text-gray-400 mt-2 text-sm max-w-xs">
              我可以帮你分析基金趋势、生成投资策略或解答金融疑问。
            </p>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            className="w-full h-full"
            data={messages}
            // 🌟 自动监听滚动到顶部，触发加载更多
            startReached={loadMoreHistory}
            // 🌟 自动跟随流式输出滚动到底部 (打字机效果)
            followOutput="smooth"
            // 🌟 初次渲染时直接定位到最后一条消息
            initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
            // 列表的首尾留白间距
            components={{
              Header: () => <div className="h-4"></div>,
              Footer: () => <div className="h-8"></div>,
            }}
            // 渲染单条消息
            itemContent={(index, msg) => {
              const isLastMsg = index === messages.length - 1;
              return (
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
                  <div
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } ${isLastMsg ? "animate-in fade-in slide-in-from-bottom-2 duration-300" : ""}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[85%] group ${
                        msg.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {/* 角色头像 */}
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                          msg.role === "user"
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-white border border-gray-200 text-gray-600 shadow-sm"
                        }`}
                      >
                        {msg.role === "user" ? "U" : <Bot size={16} />}
                      </div>

                      {/* 消息气泡 */}
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 rounded-tr-none"
                            : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <AiResponse model={msg} />
                        )}
                      </div>

                      {/* 复制按钮 */}
                      {msg.role === "user" && (
                        <button
                          onClick={() => handleCopy(msg.content)}
                          title="复制内容"
                          className="mt-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-indigo-600"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
      </main>

      {/* 3. 输入区域 */}
      <div className="bg-white p-4 md:p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto relative group">
          {/* 停止按钮 */}
          {isLoading && (
            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                title="终止对话"
                onClick={stopChat}
                className="group flex items-center gap-2 px-5 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg hover:border-red-200 hover:text-red-500 transition-all active:scale-95"
              >
                <span className="w-2.5 h-2.5 bg-gray-500 rounded-sm transition-colors group-hover:bg-red-500"></span>
                停止生成
              </button>
            </div>
          )}

          <textarea
            rows={1}
            className="w-full border border-gray-200 rounded-2xl px-5 py-4 pr-14 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none bg-gray-50/50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading) handleSend();
              }
            }}
            placeholder="发送消息"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${
              input.trim() && !isLoading
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-3 tracking-tight">
          AI 可能会产生错误信息，请核实重要财务决策。
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
