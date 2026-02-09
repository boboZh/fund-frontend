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
    <div className="mb-2 transition-all">
      {/** 总结行: 点击切换 展开、折叠 */}
      <div
        onClick={() => setIsExpand(!isExpand)}
        className="flex items-center gap-2 text-xs text-indigo-500 cursor-pointer bg-indigo-50/50 w-fit px-3 py-1.5 rounded-full hover:bg-indigo-100 transition"
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
        <div className="mt-2 ml-4 pl-4 border-1-2 border-indigo-100 space-y-2 py-2 animate-in fade-in slide-in-from-top-2">
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
