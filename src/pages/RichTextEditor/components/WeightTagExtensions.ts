import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { WeightTagComponent } from "./WeightTag";

export const WeightTagExtension = Node.create({
  name: "weightTag",

  // 亮点：设置为 inline 和 atom
  group: "inline",
  inline: true,
  atom: true, // 核心机制：声明为原子节点，光标只能跳过它，不能进入它内部编辑，像按 Backspace 会一键删掉整个胶囊！

  // 定义这个节点需要存储哪些数据
  addAttributes() {
    return {
      text: {
        default: "提示词",
      },
      weight: {
        default: 1.0,
      },
    };
  },

  // 告诉 Tiptap 如何把一段 HTML 解析成这个胶囊 (比如用户从别的地方复制粘贴过来时)
  parseHTML() {
    return [
      {
        tag: 'span[data-type="weightTag"]',
      },
    ];
  },

  // 告诉 Tiptap 在最终输出 HTML 时长什么样 (反序列化时用到)
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": "weightTag" })];
  },

  // 亮点：将这个 Tiptap 节点与上面我们写的 React 组件绑定！
  addNodeView() {
    return ReactNodeViewRenderer(WeightTagComponent);
  },
});
