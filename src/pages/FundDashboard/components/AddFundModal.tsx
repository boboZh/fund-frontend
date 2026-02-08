import React, { useState } from "react";
import { X, Search } from "lucide-react";
import type { FundItem } from "@/types/fund";
import { apiGetFundInfo } from "@/apis/fund.api";
import { toast } from "sonner";
import { allStockRegex } from "@/utils/tools";

interface AddFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (funds: FundItem[]) => void;
}

const AddFundModal: React.FC<AddFundModalProps> = ({ isOpen, onClose, onConfirm }) => {
  // 手动输入状态
  const [manualData, setManualData] = useState<FundItem>({
    fundCode: "",
    fundName: "",
    amount: "",
  });

  if (!isOpen) return null;

  // 1. 手动输入：根据代码获取基金名称
  const handleSearchFund = async () => {
    if (manualData.fundCode.match(allStockRegex) === null) return;
    try {
      // 假设后端有这个搜索接口
      const res = await apiGetFundInfo(manualData.fundCode);
      if (!res.data.fundName) {
        toast.error("未找到该基金");
        setManualData({ ...manualData, fundName: "" });
      } else {
        setManualData({ ...manualData, fundName: res.data.fundName });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "未找到该基金");
    }
  };

  const handleClose = () => {
    setManualData({ fundCode: "", fundName: "", amount: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-xl font-bold text-gray-800">添加持仓数据</h3>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">基金代码</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="如 001508"
                    value={manualData.fundCode}
                    onChange={(e) => setManualData({ ...manualData, fundCode: e.target.value })}
                  />
                  <button
                    onClick={handleSearchFund}
                    className="absolute right-2 top-1.5 p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">基金名称</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-gray-50"
                  value={manualData.fundName}
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">持仓金额 (元)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="请输入持仓总金额"
                value={manualData.amount}
                onChange={(e) => setManualData({ ...manualData, amount: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl bg-gray-100 font-bold"
              >
                取消
              </button>
              <button
                onClick={() => onConfirm([manualData])}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg"
              >
                确定添加
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFundModal;
