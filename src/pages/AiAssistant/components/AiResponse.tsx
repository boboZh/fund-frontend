import type { AiChatModel, ResearchCitation } from "@/types/ai";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AiSteps from "./AiSteps";
import { AlertCircle, Ban } from "lucide-react";

interface AiResponseProps {
  model: AiChatModel;
}

const pageLabel = (page: number | null) => (page ? `第 ${page} 页` : "");

const citationText = (source: ResearchCitation) =>
  [source.title, source.org, source.reportDate, pageLabel(source.page), source.heading]
    .filter(Boolean)
    .join(" · ");

// 正文里的 [1] 只在来源列表里有对应 ref 时变成按钮，避免把普通方括号也点亮。
const linkCitations = (content: string, sources: ResearchCitation[] | null | undefined) => {
  if (!sources?.length) return content;
  const refs = new Set(sources.map((source) => source.ref));
  return content.replace(/\[(\d+)\]/g, (match, raw) => {
    const ref = Number(raw);
    if (!refs.has(ref)) return match;
    return `[${raw}](#source-${ref})`;
  });
};

const AiResponse: React.FC<AiResponseProps> = React.memo(
  ({ model }) => {
    const [openRefs, setOpenRefs] = useState<number[]>([]);
    const sources = model.sources || [];

    const toggle = (ref: number) => {
      setOpenRefs((prev) => (prev.includes(ref) ? prev.filter((item) => item !== ref) : [...prev, ref]));
    };

    const openCitation = (ref: number) => {
      setOpenRefs((prev) => (prev.includes(ref) ? prev : [...prev, ref]));
      requestAnimationFrame(() => {
        document.getElementById(`source-${model.id}-${ref}`)?.scrollIntoView({ block: "nearest" });
      });
    };

    return (
      // 加上 flex flex-col 彻底阻断 Margin Collapsing（外边距折叠）
      // 这是让 Virtuoso 能够 100% 精准测量高度的前提！
      <div className="ai-response flex flex-col">
        {model?.status !== "abort" && <AiSteps steps={model.steps || []} />}

        {/* 给 Markdown 容器加上 gap，用 flex 替代 margin */}
        <div className="flex flex-col gap-2">
          <ReactMarkdown
            // 默认解析器不认 GFM 表格，模型写出的 | 列会变成纯文本。
            remarkPlugins={[remarkGfm]}
            components={{
              // 拦截 Markdown 中的 p 标签，强制去掉 margin，改用父级的 gap 撑开间距
              // eslint-disable-next-line
              p: ({ node, ...props }) => <p className="m-0 leading-relaxed" {...props} />,
              // 气泡宽度有限，列多时在卡片内横向滚动，避免把整条消息撑出屏幕。
              // eslint-disable-next-line
              table: ({ node, ...props }) => (
                <div className="my-1 w-full overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs" {...props} />
                </div>
              ),
              // eslint-disable-next-line
              thead: ({ node, ...props }) => (
                <thead className="bg-gray-50 text-gray-500" {...props} />
              ),
              // eslint-disable-next-line
              th: ({ node, ...props }) => (
                <th
                  className="border-b border-gray-200 px-3 py-2 font-medium whitespace-nowrap"
                  {...props}
                />
              ),
              // eslint-disable-next-line
              td: ({ node, ...props }) => (
                <td className="border-b border-gray-100 px-3 py-2 align-top" {...props} />
              ),
              // eslint-disable-next-line
              a: ({ node, href, children, ...props }) => {
                if (href?.startsWith("#source-")) {
                  const ref = Number(href.slice("#source-".length));
                  return (
                    <button
                      type="button"
                      onClick={() => openCitation(ref)}
                      className="text-indigo-600 font-medium"
                    >
                      [{children}]
                    </button>
                  );
                }
                return (
                  <a href={href} {...props}>
                    {children}
                  </a>
                );
              },

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
            {linkCitations(model.content, sources)}
          </ReactMarkdown>
        </div>

        {sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
            {sources.map((source) => {
              const opened = openRefs.includes(source.ref);
              return (
                <div key={source.ref} id={`source-${model.id}-${source.ref}`}>
                  <button
                    type="button"
                    aria-expanded={opened}
                    onClick={() => toggle(source.ref)}
                    className="text-left text-xs text-gray-600 hover:text-indigo-600"
                  >
                    [{source.ref}] {citationText(source)}
                  </button>
                  {opened && (
                    <p className="mt-1 text-xs leading-relaxed text-gray-500 whitespace-pre-wrap">
                      {source.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
  },
  (prevProps, nextProps) => prevProps.model === nextProps.model,
);

export default AiResponse;
