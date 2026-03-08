import React, { useState, useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { Send, Bot, Copy, Loader2 } from "lucide-react";
import AiResponse from "./AiResponse";
import useStore from "@/store";
import { apiGetMsgList } from "@/apis/ai.api";
import useChatStream from "@/hooks/useChatStream";
import { toast } from "sonner";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

interface ChatPanelProps {
  sessionId: string | undefined;
  onChatLoaded: (sessionId: string) => void;
  headerSlot?: React.ReactNode;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, onChatLoaded, headerSlot }) => {
  const { user, sessions: allSessions, isInitialLoaded } = useStore();

  const { input, messages, setInput, setMessages, handleSend, isLoading, stopChat } = useChatStream(
    sessionId,
    onChatLoaded,
  );

  const currentSessionIdRef = useRef<string | undefined>(undefined);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  //  保持向上加载时的滚动位置不跳动
  // 给一个足够大的初始值，每次向上加载历史时减去加载的条数
  const START_INDEX = 10000;
  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
  //  记录用户是否处于最底部
  const isAtBottomRef = useRef(true);

  //  记录上一次的消息长度和起始索引，用来精准判断是“发新消息”还是“加载历史”
  const prevMsgLengthRef = useRef(messages.length);
  const prevFirstIndexRef = useRef(firstItemIndex);

  // 提取最后一条消息的内容，用于监听 AI 打字
  const lastMessageContent = messages[messages.length - 1]?.content;

  const curSession = allSessions.find((s) => s.sessionId === sessionId) || null;

  useEffect(() => {
    const isNewMessageAdded = messages.length > prevMsgLengthRef.current;
    const isHistoryLoaded = firstItemIndex < prevFirstIndexRef.current;

    prevMsgLengthRef.current = messages.length;
    prevFirstIndexRef.current = firstItemIndex;

    // 场景 A：用户发新消息，或者 AI 刚冒出气泡 -> 优雅地平滑滚动
    if (isNewMessageAdded && !isHistoryLoaded) {
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: firstItemIndex + messages.length - 1,
          align: "end",
          behavior: "smooth", // 新气泡出现时，平滑滚动
        });
      });
      return;
    }

    // 场景 B：AI 正在流式打字 (内容不断变化) -> 瞬间吸底，拒绝延迟！
    // 只有当用户没有故意往上翻看历史记录时，才自动跟随
    if (isAtBottomRef.current && !isHistoryLoaded) {
      virtuosoRef.current?.scrollToIndex({
        index: firstItemIndex + messages.length - 1,
        align: "end",
        behavior: "auto", // ⚠️ 必须是 auto！瞬间贴合，打字机效果完美呈现
      });
    }
  }, [messages.length, firstItemIndex, lastMessageContent]);

  // 加载会话历史
  const loadChatHistory = useCallback(
    async (sid: string, targetPage: number) => {
      if (targetPage === 1) setIsFetchingMore(false);

      try {
        const result = await apiGetMsgList({
          sessionId: sid,
          page: targetPage,
          pageSize: 15, // 虚拟列表可以适当调大 pageSize
        });
        const newList = result.data.list;
        const more = result.data.hasMore;

        // 使用 flushSync 强制 React 同步更新 DOM！
        // 保证数据插入、索引更新、DOM 渲染在同一个浏览器的“帧”内完成。
        // 让 Virtuoso 有机会在浏览器绘制前，瞬间把滚动条拉回正确的位置，彻底告别闪烁！
        flushSync(() => {
          if (targetPage === 1) {
            setFirstItemIndex(START_INDEX);
            setMessages(newList);
          } else {
            // 不能把 setFirstItemIndex 写在 setMessages 的回调里！
            // 必须像这样平行、同步地更新！
            setFirstItemIndex((prev) => prev - newList.length);
            setMessages((prev) => [...newList, ...prev]);
          }
        });

        setHasMore(more);
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
      //  eslint-disable-next-line
      setPage(1);
      setHasMore(true);
      setInput("");
      // 切换会话时，立即重置分页和索引状态
      // 这一步很重要，确保新会话从 10000 开始，而不是继承上一个会话的偏移量
      setFirstItemIndex(START_INDEX);

      if (sessionId) {
        const validSession = allSessions.find((s) => s.sessionId === sessionId);
        if (validSession) {
          // 先清空消息，避免画面残留上一会话的内容
          setMessages([]);
          loadChatHistory(sessionId, 1);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }
  }, [sessionId, loadChatHistory, setMessages, allSessions, setInput, isInitialLoaded]);

  // 向上滚动触顶时触发加载更多
  const handleStartReached = useCallback(async () => {
    if (!hasMore || isFetchingMore) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    await loadChatHistory(sessionId!, nextPage);
    setIsFetchingMore(false);
    setPage(nextPage);
  }, [hasMore, isFetchingMore, page, loadChatHistory, sessionId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  useEffect(() => {
    return () => stopChat();
  }, [stopChat]);

  return (
    <div className="flex-1 flex flex-col relative bg-white h-full">
      {/* 1. 顶部 Header */}
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

      {/* 2. 消息展示区 - 替换为 Virtuoso */}
      <main className="flex-1 bg-[#fafafa] relative">
        {/* 🌟 优化 4：将 Loading 圈从 Virtuoso 内部抽离到外部绝对定位 */}
        {/* 这样 Loading 的出现和消失，绝对不会影响虚拟列表内部的高度计算，防止高度塌陷闪烁 */}
        {isFetchingMore && (
          <div className="absolute top-0 left-0 w-full h-14 flex items-center justify-center z-20 bg-gradient-to-b from-[#fafafa] to-transparent">
            <Loader2 className="animate-spin text-indigo-500 w-5 h-5" />
          </div>
        )}

        {messages.length === 0 && !isFetchingMore ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
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
            data={messages}
            key={sessionId}
            firstItemIndex={firstItemIndex}
            initialTopMostItemIndex={messages.length - 1}
            startReached={handleStartReached}
            // 增加底部判定的容错距离！
            // 实时记录用户是否在底部（容错 150px）
            atBottomThreshold={150}
            atBottomStateChange={(isAtBottom) => {
              isAtBottomRef.current = isAtBottom;
            }}
            // 将底层的跟随机制也改为 "auto" (瞬间贴合)
            followOutput={(isAtBottom) => (isAtBottom ? "auto" : false)}
            // 移除 alignToBottom={true}，它与向上加载历史记录严重冲突！

            // 增加默认预估高度。防止 AiResponse 异步渲染 Markdown 时高度从 0 突变
            defaultItemHeight={100}
            // 加大预渲染范围，上下各预渲染 1000px，彻底消灭白屏
            increaseViewportBy={{ top: 1000, bottom: 1000 }}
            computeItemKey={(index, msg) => msg.id}
            className="w-full h-full"
            // 强制禁用浏览器的原生滚动锚定，防止它和虚拟列表“打架”
            style={{ overflowAnchor: "none" }}
            components={{
              Header: () => <div className="h-6"></div>,
              Footer: () => <div className="h-4"></div>,
            }}
            itemContent={(index, msg) => {
              // 修正 isLastMsg 的计算逻辑！
              // 在 Virtuoso 中使用了 firstItemIndex 后，传入的 index 是绝对索引（比如 9990）
              // 所以必须加上 firstItemIndex 才能正确判断是否是最后一条！
              const isLastMsg = index === firstItemIndex + messages.length - 1;

              return (
                <div className="max-w-4xl mx-auto px-4 md:px-8 pb-8">
                  <div
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${
                      // 确保这里的动画只对“真正的新消息”生效，历史记录绝对不能带动画！
                      isLastMsg ? "animate-in fade-in slide-in-from-bottom-2 duration-300" : ""
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[85%] group ${
                        msg.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {/* 头像 */}
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
                          // 如果这里面有 <img />，必须写死 min-height 或 aspect-ratio！
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
                </div>
              );
            }}
          />
        )}
      </main>

      {/* 3. 输入区域 (保持不变) */}
      <div className="bg-white p-4 md:p-6">
        <div className="max-w-4xl mx-auto relative group">
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
