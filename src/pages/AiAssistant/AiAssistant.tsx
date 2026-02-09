import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, X } from "lucide-react";
import type { FundItem } from "@/types/fund";
import useStore from "@/store";
import { toast } from "sonner";
import type { AiChatModel, AiTaskStatus } from "@/types/ai";
import { streamParser } from "@/utils/streamParser";
import AiResponse from "./components/AiResponse";
import { myFetch } from "@/utils/myFetch";

interface AiAssistantProps {
  funds: FundItem[];
}

const AiAssistant: React.FC<AiAssistantProps> = ({ funds }) => {
  const store = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiChatModel[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

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
          funds,
          userNickname: store.user?.nickname || "用户",
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition active:scale-95"
        >
          <Bot className="w-6 h-6" />
        </button>
      ) : (
        <div className="flex flex-col h-[90vh] bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 animate-pulse" />
              <span className="font-bold tracking-wide">AI 策略助手</span>
            </div>
            <X
              className="cursor-pointer hover:rotate-90 transition"
              onClick={() => setIsOpen(false)}
            />
          </div>
          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto bg-slate-50">
            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-800 shadow-sm border"
                    }`}
                  >
                    {msg.role === "user" ? msg.content : <AiResponse model={msg} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 输入区域 */}
          <div className="p-4 bg-white border-t flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="问问 AI 助手..."
            />
            <button
              onClick={handleSend}
              className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
