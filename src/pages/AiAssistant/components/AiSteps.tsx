import type { MessageStep } from "@/types/ai";
import { Check, CheckCircle, ChevronDown, CircleDotDashed, Loader2 } from "lucide-react";
import React, { useState } from "react";

interface AiStepsProps {
  steps: MessageStep[];
}

const AiSteps: React.FC<AiStepsProps> = ({ steps }) => {
  const [isExpand, setIsExpand] = useState(false);
  if (!steps || steps.length === 0) return null;

  const lastStep = steps[steps.length - 1];
  const isAllDone = steps.every((s) => s.status === "success");
  const error = steps.some((s) => s.status === "error");

  return (
    // 🌟 修复 5：将 mb-2 改为 pb-2，并【彻底移除】 transition-all！
    // transition-all 会导致组件挂载时高度发生渐变，让 Virtuoso 瞬间算错高度。
    <div className="pb-2">
      {/** 总结行: 点击切换 展开、折叠 */}
      <div
        onClick={() => setIsExpand(!isExpand)}
        // 🌟 修复 6：只保留颜色的过渡 (transition-colors)，绝对不能过渡高度或 padding
        className="flex items-center gap-2 text-xs text-indigo-500 cursor-pointer bg-indigo-50/50 w-fit px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
      >
        {isAllDone ? (
          <CheckCircle className="w-3 h-3 text-green-500" />
        ) : error ? (
          <CircleDotDashed className="w-3 h-3 text-red-500" />
        ) : (
          <Loader2 className="w-3 h-3 animate-spin" />
        )}
        <span>{isAllDone ? `已完成${steps.length}个步骤` : lastStep.text}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isExpand ? "rotate-180" : ""}`} />
      </div>

      {/* 展开后的日志流明细 */}
      {isExpand && (
        // 🌟 修复 7：移除了 animate-in fade-in slide-in-from-top-2
        // 在虚拟列表中，展开/折叠最好是瞬间完成的 DOM 切换，否则动画过程中的高度变化会让滚动条疯狂抖动。
        <div className="mt-2 ml-4 pl-4 border-l-2 border-indigo-100 space-y-2 py-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 text-xs">
              {step.status === "loading" && (
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
              )}
              {step.status === "success" && <Check className="w-3 h-3 text-green-500" />}
              {step.status === "error" && <CircleDotDashed className="w-3 h-3 text-red-500" />}

              <span
                className={
                  step.status === "success" ? "text-gray-400" : "text-gray-600 font-medium"
                }
              >
                {step.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiSteps;
