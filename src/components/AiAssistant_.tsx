import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2 } from "lucide-react";
import type { FundItem } from "@/types/fund";
import ReactMarkdown from "react-markdown";
import useStore from "@/store";

interface Props {
  funds: FundItem[];
}

const AiAssistant: React.FC<Props> = ({ funds }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [advice, setAdvice] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const store = useStore();

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [advice]);

  const handleStartAnalyze = async () => {
    setIsOpen(true);
    setAdvice(""); // 清空旧内容
    setIsTyping(true);

    return;

    try {
      const response = await fetch("/api/ai/analyze-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funds, userNickname: store.user?.nickname || "用户" }),
        // 注意：如果你后端用了 Cookie 鉴权，fetch 必须带上这个
        credentials: "include",
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        // 逐个分块追加到状态中，产生打字机效果
        setAdvice((prev) => prev + chunkValue);
      }
    } catch (err) {
      setAdvice(err instanceof Error ? err.message : "诊断失败，请检查网络或稍后再试。");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={handleStartAnalyze}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition active:scale-95"
        >
          <Bot className="w-6 h-6" />
        </button>
      ) : (
        <div className="bg-white w-96 h-[500px] rounded-3xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden border-indigo-100">
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

          {/* Chat Content */}
          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto bg-slate-50">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 leading-relaxed text-gray-700 text-sm whitespace-pre-wrap">
              {advice ? (
                <ReactMarkdown>{advice}</ReactMarkdown>
              ) : (
                isTyping && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              )}

              {isTyping && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="p-4 bg-white border-t flex gap-2">
            <div className="text-[10px] text-gray-400 italic">
              *AI 建议仅供参考，不构成投资依据。理财有风险，入市需谨慎。
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
