import type { FundItem } from "@/types/fund";
import { BellRing, MoreVertical, Trash2 } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ActionMenuProps {
  fund: FundItem;
  onDelete: (fund: FundItem) => void;
  onSetAlert: (fund: FundItem) => void;
}
// --- 新增：每一行的下拉操作菜单组件 ---
const ActionMenu: React.FC<ActionMenuProps> = ({ fund, onDelete, onSetAlert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null); // 🌟 新增：给菜单也加一个 Ref

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 128,
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 🌟 核心修复：只有点击既不在按钮内，也不在菜单内，才关闭
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    // 🌟 建议改用 'click' 或 'mousedown' 保持一致，这里用 mousedown 比较灵敏
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={`p-2 rounded-xl transition-all ${
          isOpen ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:bg-gray-100"
        }`}
      >
        <MoreVertical className="w-5 h-5 outline-none" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef} // 🌟 必须绑定这个 Ref
            className="fixed z-[9999] w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: coords.top + 4, left: coords.left }}
          >
            <button
              onClick={() => {
                console.log("点击了设置提醒"); // 调试用
                onSetAlert(fund);
                setIsOpen(false); // 先执行逻辑，再关闭
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
            >
              <BellRing className="w-4 h-4" /> 设置提醒
            </button>

            <div className="h-px bg-gray-50 my-1"></div>

            <button
              onClick={() => {
                console.log("点击了删除"); // 调试用
                if (window.confirm(`确定要删除 ${fund.fundName} 吗？`)) {
                  onDelete(fund);
                }
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> 删除
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ActionMenu;
