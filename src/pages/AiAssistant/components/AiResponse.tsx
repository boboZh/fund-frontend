import type { AiChatModel } from "@/types/ai";
import React from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Search, BrainCircuit } from "lucide-react";
import AiSteps from "./AiSteps";

interface AiResponseProps {
  model: AiChatModel;
}
const AiResponse: React.FC<AiResponseProps> = ({ model }) => {
  return (
    <div className={`ai-response`}>
      {/* 状态指示器：根据 status 显示不同的图标 */}
      {/* {model.currentTaskText && (
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-500 bg-indigo-50 w-fit px-3 py-1 rounded-full animate-pulse">
          {model.currentTaskType && ["searching"].includes(model.currentTaskType) ? (
            <Search className="w-3 h-3" />
          ) : (
            <BrainCircuit className="w-3 h-3" />
          )}
          {model.currentTaskText}
        </div>
      )} */}
      <AiSteps steps={model.steps || []} />
      <ReactMarkdown>{model.content}</ReactMarkdown>
    </div>
  );
};

export default AiResponse;
