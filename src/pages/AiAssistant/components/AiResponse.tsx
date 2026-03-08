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
    // 加上 flex flex-col 彻底阻断 Margin Collapsing（外边距折叠）
    // 这是让 Virtuoso 能够 100% 精准测量高度的前提！
    <div className="ai-response flex flex-col">
      <AiSteps steps={model.steps || []} />

      {/* 给 Markdown 容器加上 gap，用 flex 替代 margin */}
      <div className="flex flex-col gap-2">
        <ReactMarkdown
          components={{
            // 拦截 Markdown 中的 p 标签，强制去掉 margin，改用父级的 gap 撑开间距
            // eslint-disable-next-line
            p: ({ node, ...props }) => <p className="m-0 leading-relaxed" {...props} />,

            // 拦截 img 标签。如果历史记录里有图片，异步加载会撑开高度导致闪烁。
            // 给它一个默认的 min-height 可以完美缓解这个问题。
            // eslint-disable-next-line
            img: ({ node, ...props }) => (
              <img
                {...props}
                className="max-w-full h-auto min-h-[100px] bg-gray-50 rounded-lg"
                alt={props.alt || ""}
              />
            ),
          }}
        >
          {model.content}
        </ReactMarkdown>
      </div>

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
