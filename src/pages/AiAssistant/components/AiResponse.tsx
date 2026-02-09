import type { AiChatModel, MsgStatus } from "@/types/ai";
import React from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Search, BrainCircuit } from "lucide-react";

interface AiResponseProps {
  model: AiChatModel;
  msgStatus?: MsgStatus;
}
const AiResponse: React.FC<AiResponseProps> = ({ model, msgStatus = {} }) => {
  const { status, statusText, isTyping } = msgStatus;
  return (
    <div className={`ai-response`}>
      {/* 状态指示器：根据 status 显示不同的图标 */}
      {statusText && (
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-500 bg-indigo-50 w-fit px-3 py-1 rounded-full animate-pulse">
          {status && ["searching"].includes(status) ? (
            <Search className="w-3 h-3" />
          ) : (
            <BrainCircuit className="w-3 h-3" />
          )}
          {statusText}
        </div>
      )}
      <ReactMarkdown>{model.content}</ReactMarkdown>
      {isTyping && model.content === "" && (
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
      )}
    </div>
  );
};

export default AiResponse;
