import React from "react";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";

export interface WeightTagAttrs {
  text: string;
  weight: number;
}

export const WeightTagComponent: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
  // 从 Tiptap AST 中获取当前节点的属性
  const { text, weight } = node.attrs as WeightTagAttrs;

  // 点击 "+" 增加权重
  const increaseWeight = () => {
    // 不直接改 DOM，而是通过 updateAttributes 通知 Tiptap 更新 AST
    updateAttributes({ weight: Number((weight + 0.1).toFixed(1)) });
  };

  // 点击 "-" 减少权重
  const decreaseWeight = () => {
    updateAttributes({ weight: Math.max(0.1, Number((weight - 0.1).toFixed(1))) });
  };

  return (
    // 亮点：必须用 NodeViewWrapper 包裹，告诉 Tiptap 这是一个自定义节点视图
    <NodeViewWrapper className="inline-block mx-1 align-middle">
      <span className="flex items-center bg-blue-100 border border-blue-300 rounded-full px-2 py-0.5 text-sm select-none">
        {/* 词条本体 */}
        <span className="text-blue-800 font-medium mr-2">{text}</span>

        {/* 权重控制器 */}
        <span className="flex items-center space-x-1 bg-white rounded-full px-1">
          <button onClick={decreaseWeight} className="text-gray-500 hover:text-blue-600 px-1">
            -
          </button>
          <span className="text-xs text-gray-700 w-6 text-center">{weight}</span>
          <button onClick={increaseWeight} className="text-gray-500 hover:text-blue-600 px-1">
            +
          </button>
        </span>
      </span>
    </NodeViewWrapper>
  );
};
