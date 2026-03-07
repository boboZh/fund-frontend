import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { WeightTagExtension } from "./WeightTagExtension";

export const PromptEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      WeightTagExtension, // 注册我们的自定义扩展
    ],
    content:
      '<p>一幅美丽的画，包含 <span data-type="weightTag" data-text="赛博朋克" data-weight="1.5"></span> 的风格。</p>',
  });

  // 测试功能：外部按钮主动插入一个胶囊
  const insertTag = () => {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: "weightTag",
        attrs: { text: "机甲", weight: 1.2 },
      })
      .run();
  };

  return (
    <div className="p-4 border rounded shadow-sm">
      <button onClick={insertTag} className="mb-4 bg-black text-white px-3 py-1 rounded">
        插入 [机甲:1.2] 胶囊
      </button>
      <div className="border p-2 min-h-[150px] focus:outline-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
