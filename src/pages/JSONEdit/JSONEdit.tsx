import React, { useState } from "react";
import { useImmer } from "use-immer"; // 💡 面试高频亮点：使用 Immer 处理深层嵌套

/**
 * 它利用 ES6 的 Proxy 代理机制，让我们可以用 draft["6"].inputs.text = newValue 这种看似直接修改（Mutate）的方式写代码，但 Immer 底层会帮我们生成一个全新的、结构共享的 Immutable 对象。这既保证了 React 数据流的安全性，又极大地提升了复杂 AIGC 表单的开发效率。
 *
 * 另外，真实的 ComfyUI JSON 模板（Base Workflow）我不建议硬编码在前端。我会让 Node.js 层提供一个接口，前端在初始化时拉取这个模板。这样即使后端算法团队更新了 ComfyUI 的节点连线图，只要暴露出来的入参字段名不变，前端代码甚至可以做到零修改发布。
 */

// 1. 定义底层 ComfyUI 的基准工作流模板 (相当于写死的底座)
const baseWorkflow = {
  "3": {
    class_type: "KSampler",
    inputs: { seed: 12345, steps: 20, cfg: 8 },
  },
  "5": {
    class_type: "EmptyLatentImage",
    inputs: { width: 1024, height: 1024, batch_size: 1 },
  },
  "6": {
    class_type: "CLIPTextEncode",
    inputs: { text: "a beautiful girl" },
  },
};

export default function AIGCForm() {
  // 使用 useImmer 替代普通的 useState
  const [workflow, setWorkflow] = useImmer(baseWorkflow);
  const [isGenerating, setIsGenerating] = useState(false);

  // 💡 优雅的状态更新：不需要写无数个 ...spread，直接修改 draft (草稿)
  const handlePromptChange = (e) => {
    setWorkflow((draft) => {
      draft["6"].inputs.text = e.target.value;
    });
  };

  const handleStepsChange = (e) => {
    setWorkflow((draft) => {
      // 注意转成数字，ComfyUI 对数据类型要求很严格
      draft["3"].inputs.steps = Number(e.target.value);
    });
  };

  const handleWidthChange = (e) => {
    setWorkflow((draft) => {
      draft["5"].inputs.width = Number(e.target.value);
    });
  };

  // 模拟提交给后端的动作
  const handleGenerate = async () => {
    setIsGenerating(true);

    // 最终组装好的、符合 ComfyUI API 格式的 payload
    const payload = { prompt: workflow };
    console.log("🚀 准备发送给 Node.js 中间层的 JSON:", JSON.stringify(payload, null, 2));

    try {
      // 真实场景下这里是 fetch('/api/generate', { method: 'POST', body: JSON.stringify(payload) })
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("提交成功！请看控制台打印的完整 JSON 结构。");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold">AIGC 剧本分镜生成器</h2>

      {/* 表单 UI 完全掩盖了底层 JSON 的复杂节点关系 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">画面描述 (Prompt)</label>
        <textarea
          className="mt-1 block w-full border rounded-md p-2"
          value={workflow["6"].inputs.text}
          onChange={handlePromptChange}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">精细度 (Steps)</label>
          <input
            type="number"
            className="mt-1 block w-full border rounded-md p-2"
            value={workflow["3"].inputs.steps}
            onChange={handleStepsChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">画面宽度 (px)</label>
          <select
            className="mt-1 block w-full border rounded-md p-2"
            value={workflow["5"].inputs.width}
            onChange={handleWidthChange}
          >
            <option value={512}>512</option>
            <option value={768}>768</option>
            <option value={1024}>1024</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isGenerating ? "加入队列中..." : "一键生成分镜"}
      </button>
    </div>
  );
}
