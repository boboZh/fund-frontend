import type { AiChatModel } from "@/types/ai";
import React from "react";
import ReactMarkdown from "react-markdown";
import AiSteps from "./AiSteps";
import { AlertCircle, Ban } from "lucide-react";

interface AiResponseProps {
  model: AiChatModel;
}
const AiResponse: React.FC<AiResponseProps> = ({ model }) => {
  return (
    <div className={`ai-response`}>
      <AiSteps steps={model.steps || []} />
      <ReactMarkdown>{model.content}</ReactMarkdown>
      {model.status === "error" && (
        <div className="mt-3 pt-3 border-t border-red-100 text-xs text-red-500 flex items-center gap-1.5 font-medium">
          <AlertCircle size={14} /> AI 暂时休息了，生成意外中断
        </div>
      )}
      {model.status === "abort" && (
        <div className="mt-3 pt-3 border-t border-orange-100 text-xs text-orange-500 flex items-center gap-1.5 font-medium">
          <Ban size={14} /> 对话已被您主动终止
        </div>
      )}
    </div>
  );
};

export default AiResponse;
