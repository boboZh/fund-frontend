import React, { useState, useLayoutEffect, useRef, useCallback, useEffect } from "react";
import { Send, Bot, Copy, Loader2 } from "lucide-react";
import AiResponse from "./AiResponse";
import useStore from "@/store";
import { apiGetMsgList } from "@/apis/ai.api";
import useChatStream from "@/hooks/useChatStream";
import { toast } from "sonner";

interface ChatPanelProps {
  sessionId: string | undefined;
  onChatLoaded: (sessionId: string) => void;
  headerSlot?: React.ReactNode;
}
const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, onChatLoaded, headerSlot }) => {
  const { user, sessions: allSessions, isInitialLoaded } = useStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isPrependingRef = useRef<boolean>(false); // 是否正在往顶部塞就消息
  const prevMsgLengthRef = useRef<number>(0);

  const { input, messages, setInput, setMessages, handleSend, isLoading, stopChat } = useChatStream(
    sessionId,
    onChatLoaded,
  );

  const currentSessionIdRef = useRef<string | undefined>(undefined);

  // 消息记录分页
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // --- 衍生状态：由 URL 和 Store 共同决定 ---
  const curSession = allSessions.find((s) => s.sessionId === sessionId) || null;

  // 加载会话历史
  const loadChatHistory = useCallback(
    async (sid: string, targetPage: number) => {
      if (targetPage === 1) setIsFetchingMore(false); // 重置

      try {
        const result = await apiGetMsgList({
          sessionId: sid,
          page: targetPage,
          pageSize: 5,
        });
        const newList = result.data.list;
        const more = result.data.hasMore;

        // 在网络请求发起之后，数据更新之前记录滚动高度
        if (targetPage > 1 && scrollRef.current) {
          // 记录加载前的总高度
          prevScrollHeightRef.current = scrollRef.current.scrollHeight;
          // 打标记：记录正在往顶部塞旧消息
          isPrependingRef.current = true;
        }
        setMessages((prev) => {
          // 如果是第一页，直接覆盖；否则把旧消息拼在前面
          return targetPage === 1 ? newList : [...newList, ...prev];
        });
        setHasMore(more);

        // 初次加载，滚动到最底部
        if (targetPage === 1) {
          /**
           * 不能用setTimeout(()=>{}, 0)
           * React 在更新状态后不会立刻把 DOM 布局更新到“下一帧”，React 18 还有批量更新与调度；
           * setTimeout(..., 0) 只保证“尽快”执行，但很可能发生在 DOM 还没完成渲染和布局之前，scrollHeight 还是旧值或未最终计算，因此滚动目标无效。
           *
           * 如果滚动列表包含图片，则需要等图片加载完成后再滚动，使用双raf，
           * 第一次 rAF 的作用
           * - 把你的滚动逻辑推迟到“下一帧”，让这帧里 React 的 DOM 提交已完成、浏览器也完成样式与布局计算。
           * - 这样读取 el.scrollHeight 是“新列表渲染后的高度”，而不是 setMessages 刚触发时的旧值。
           * - 相比 setTimeout(0)，rAF能保证与帧同步；setTimeout 只是排到下一个宏任务，常常发生在布局前或与绘制脱节。
           *
           * 第二次 rAF 什么时候需要
           * - 列表里有图片/富文本/异步字体等，会在首帧之后继续撑高容器。
           * - 第一次 rAF 时 scrollHeight 可能还是偏小；再包一层 rAF，等到“下一帧”读取到稳定的最终高度再滚动。
           * - 双 rAF相当于：第1帧确保“已提交并做了初次布局”，第2帧确保“后续资源导致的布局变动也完成”。
           */
          requestAnimationFrame(() => {
            const el = scrollRef.current;
            if (!el) return;
            el.scrollTo({
              top: el.scrollHeight,
              behavior: "instant",
            });
          });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "获取对话历史失败");
      }
    },
    [setMessages],
  );

  useEffect(() => {
    if (!isInitialLoaded) return;
    if (sessionId !== currentSessionIdRef.current) {
      currentSessionIdRef.current = sessionId;
      // eslint-disable-next-line
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
  }, [
    sessionId,
    loadChatHistory,
    setMessages,
    allSessions,
    setPage,
    setHasMore,
    setInput,
    isInitialLoaded,
  ]);

  // 监听滚动事件
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // 当滚动到顶部 (scrollTop === 0)，且还有更多数据，且当前没在加载中
    if (target.scrollTop === 0 && hasMore && !isFetchingMore) {
      setIsFetchingMore(true);

      // 加载下一页
      const nextPage = page + 1;
      await loadChatHistory(sessionId!, nextPage);
      setIsFetchingMore(false);

      setPage(nextPage);
    }
  };

  // 核心：拦截浏览器绘制，无感调整滚动条
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // 只有向上滚动加载旧消息，才触发
    if (isPrependingRef.current) {
      const newScrollHeight = el.scrollHeight;

      el.scrollTop = newScrollHeight - prevScrollHeightRef.current;

      isPrependingRef.current = false;
      return;
    }

    // 发送新消息或者滚动到底部时，自动滚动到最底部
    const isNewMessageAdded = messages.length > prevMsgLengthRef.current;
    prevMsgLengthRef.current = messages.length;

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;

    if (isNewMessageAdded || isNearBottom) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: isNewMessageAdded ? "smooth" : "auto",
      });
    }
  }, [messages]); // 依赖messages，消息列表一变就更新

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  useEffect(() => {
    // 组件卸载时，终止流式请求
    return () => stopChat();
  }, [stopChat]);

  return (
    <div className="flex-1 flex flex-col relative bg-white h-full">
      {/* 1. 顶部 Header 优化 - 改为白色透明感 */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white/80 backdrop-blur-md z-10">
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

      {/* 2. 消息展示区 - 背景改为极简灰色 */}
      <main
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-[#fafafa]"
        style={{ overflowAnchor: "none" }}
      >
        {/* 如果正在加载旧消息，显示一个 Loading 圈 */}
        {isFetchingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-indigo-500 w-4 h-4" />
          </div>
        )}
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
          {messages.length === 0 && (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
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
          )}

          {messages.map((msg, i) => {
            const isLastMsg = i === messages.length - 1;

            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${isLastMsg ? "animate-in fade-in slide-in-from-bottom-2 duration-300" : ""}`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] group ${msg.role === "user" ? "flex-row-reverse" : ""}`}
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

                  {msg.role === "user" && (
                    <button
                      onClick={() => handleCopy(msg.content)}
                      title="复制内容"
                      className="mt-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity p1.5   text-gray-400 hover:text-indigo-600"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 3. 输入区域 - 模仿 ChatGPT 悬浮居中感 */}
      <div className="bg-white p-4 md:p-6">
        <div className="max-w-4xl mx-auto relative group">
          {/* 🌟 优化 1：悬浮在输入框正上方的停止按钮 */}
          {isLoading && (
            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                title="终止对话"
                onClick={stopChat}
                className="group flex items-center gap-2 px-5 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg hover:border-red-200 hover:text-red-500 transition-all active:scale-95"
              >
                {/* 停止图标 (小方块)，hover时跟着变红 */}
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
                // 如果正在加载，禁止回车发送
                if (!isLoading) handleSend();
              }
            }}
            placeholder="发送消息"
          />

          {/* 🌟 优化 2：发送按钮不再消失，而是在加载时变灰并转圈 */}
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
