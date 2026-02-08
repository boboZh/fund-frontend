import React, { useState } from "react";
import { X, Bell } from "lucide-react";
import type { FundItem } from "@/types/fund";
import { textColor } from "@/utils/tools";
import { toast } from "sonner";
import { apiSetFundAlert } from "@/apis/fund.api";

interface AlertModalProps {
  fund: FundItem;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const AlertSettingModal: React.FC<AlertModalProps> = ({ fund, isOpen, onClose, onRefresh }) => {
  const [profitRate, setProfitRate] = useState<number | string>(fund?.targetProfitRate || "");
  const [lossRate, setLossRate] = useState<number | string>(fund?.stopLossRate || "");
  const [applyAll, setApplyAll] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiSetFundAlert({
        fundCode: fund.fundCode,
        targetProfitRate: profitRate || null,
        stopLossRate: lossRate || null,
        applyAll,
      });
      onRefresh();
      onClose();
    } catch (err) {
      toast.error("保存失败:" + (err instanceof Error && err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-800 text-lg">设置预警</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基金简报 */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
            <div className="font-bold text-gray-900">{fund.fundName}</div>
            <div className="flex justify-between mt-1 items-end">
              <span className="text-xs text-gray-400 font-mono">{fund.fundCode}</span>
              <span className={`text-sm font-bold ${textColor(fund.change)}`}>
                当前: {fund.change}
              </span>
            </div>
          </div>

          {/* 设置项 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                止盈预警 (日涨幅超过 %)
              </label>
              <input
                type="number"
                className="w-full border-gray-200 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono"
                placeholder="例如: 5.0"
                value={profitRate}
                onChange={(e) => setProfitRate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                止损预警 (日跌幅超过 %)
              </label>
              <input
                type="number"
                className="w-full border-gray-200 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono"
                placeholder="例如: 3.0"
                value={lossRate}
                onChange={(e) => setLossRate(e.target.value)}
              />
            </div>
          </div>

          {/* 同步选项 */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={applyAll}
              onChange={(e) => setApplyAll(e.target.checked)}
              className="w-5 h-5 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-500 group-hover:text-gray-700 transition">
              将此预警规则应用到持有的所有基金
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存设置"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertSettingModal;
