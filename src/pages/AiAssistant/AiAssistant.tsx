import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, Sparkles, Copy } from "lucide-react";
import type { FundItem } from "@/types/fund";
import useStore from "@/store";
import { toast } from "sonner";
import type { AiChatModel, AiTaskStatus } from "@/types/ai";
import { streamParser } from "@/utils/streamParser";
import AiResponse from "./components/AiResponse";
import { myFetch } from "@/utils/myFetch";
import ChatSidebar from "./components/ChatSideBar";
import { useParams } from "react-router-dom";
import { apiGetMsgList } from "@/apis/ai.api";
import { useNavigate } from "react-router-dom";
import type { Session } from "@/types/ai";

interface AiAssistantProps {
  funds: FundItem[];
}

const AiAssistant: React.FC<AiAssistantProps> = ({ funds }) => {
  const { sessionId: pathSessionId } = useParams();

  const navigate = useNavigate();

  const startNewSession = useStore((state) => state.startNewSession);
  const user = useStore((state) => state.user);
  const allSessions = useStore.getState().sessions;

  const [input, setInput] = useState("");
  const [curSession, setCurSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<AiChatModel[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadChatHistory = useCallback(async (sid: string) => {
    try {
      const result = await apiGetMsgList(sid);
      console.log("result: ", result);
      setMessages(result.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取对话历史失败");
    }
  }, []);

  useEffect(() => {
    // 路径上创建新对话的指令
    if (pathSessionId === "new") {
      const newId = startNewSession();
      navigate(`/chat/${newId}`, { replace: true });
      setMessages([]);
      setCurSession({ sessionId: newId, title: "新对话" });
      return;
    }
    // 处理正常切换或者手动修改URL（url驱动store）
    if (pathSessionId) {
      // 检查这个 ID 是否在现有的会话列表里 (防止用户乱敲 URL)

      const targetSession = allSessions.find((s) => s.sessionId === pathSessionId);
      console.log("targetSession; ", targetSession);
      // 会话列表为空，但是路径有sessionId，说明sessionId是无效的
      if (allSessions.length > 0) {
        navigate("/chat", {
          replace: true,
        });
        setMessages([]);
        setCurSession(null);
      } else if (targetSession) {
        setCurSession(targetSession);
        loadChatHistory(pathSessionId);
      }
    }
  }, [pathSessionId, startNewSession, navigate, loadChatHistory, allSessions, setCurSession]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const _sessionId = pathSessionId ? pathSessionId : startNewSession();

    const userMsg = input;
    setInput("");
    //
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    // 更新消息的步骤条及状态
    const updateSteps = (taskId: string, status: AiTaskStatus, text: string) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role !== "ai") return prev;

        const newSteps = [...(lastMsg.steps || [])];

        const curStep = newSteps.find((item) => item.id === taskId);
        if (!curStep) {
          newSteps.push({
            id: taskId,
            status,
            text,
          });
        } else {
          curStep.text = text;
          curStep.status = status;
        }

        return [...prev.slice(0, -1), { ...lastMsg, steps: newSteps }];
      });
    };

    let buffer = "";

    try {
      const response = await myFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          sessionId: _sessionId,
          funds,
          userNickname: user?.nickname || "用户",
        }),
        credentials: "include",
      });
      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const updateLastMsgContent = (content) => {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (!lastMsg) return prev;
          const updated: AiChatModel[] = [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              content: lastMsg.content + content,
            } as AiChatModel,
          ];
          return updated;
        });
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        console.log("chunk: ", chunk);

        buffer += chunk; // 粘合剂缓冲区

        buffer = streamParser(buffer, updateLastMsgContent, updateSteps);
      }
      if (buffer) {
        updateLastMsgContent(buffer);
        buffer = "";
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "请求失败，请稍后再试");
      console.log("toast: ", toast);
      console.log("aichat err: ", err);

      setMessages((prev) => {
        if (!prev || prev.length === 0) return [];
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role !== "ai") return prev;
        const newSteps = lastMsg.steps || [];
        newSteps.length && (newSteps[newSteps.length - 1].status = "error");
        return [
          ...prev.slice(0, -1),
          {
            ...lastMsg,
            steps: newSteps,
          },
        ];
      });
    } finally {
      setMessages((prev) => {
        if (!prev || prev.length === 0) return [];
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role !== "ai") return prev;
        const newSteps = lastMsg.steps || [];
        newSteps.length && (newSteps[newSteps.length - 1].status = "success");
        return [
          ...prev.slice(0, -1),
          {
            ...lastMsg,
            steps: newSteps,
            currentTaskText: "",
            currentTaskType: "",
          },
        ];
      });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden text-gray-900">
      {/* 侧边栏 */}
      <ChatSidebar />

      {/* 主界面区域 */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* 1. 顶部 Header 优化 - 改为白色透明感 */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">AI 策略助手</h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  Online Mode
                </span>
              </div>
            </div>
            <div>{curSession?.title || ""}</div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition">
            <Sparkles size={18} />
          </button>
        </header>

        {/* 2. 消息展示区 - 背景改为极简灰色 */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto bg-[#fafafa] scroll-smooth">
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

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
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
            ))}
          </div>
        </main>

        {/* 3. 输入区域 - 模仿 ChatGPT 悬浮居中感 */}
        <div className="bg-white p-4 md:p-6">
          <div className="max-w-4xl mx-auto relative group">
            <textarea
              rows={1}
              className="w-full border border-gray-200 rounded-2xl px-5 py-4 pr-14 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none bg-gray-50/50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="发送消息或输入 '/' 获取策略模板..."
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${
                input.trim()
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-3 tracking-tight">
            AI 可能会产生错误信息，请核实重要财务决策。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
