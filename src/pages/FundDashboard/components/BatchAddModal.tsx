import React, { useState } from "react";
import axios from "@/utils/request"; // 之前封装的带凭证的axios
import { apiGetImgInfo, apiGetFundInfo } from "../../../apis/fund.api";
import type { AddFundItem } from "@/types/fund";
import { allStockRegex } from "@/utils/tools";

interface BatchAddFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const BatchAddFundModal: React.FC<BatchAddFundModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const [ocrList, setOcrList] = useState<AddFundItem[]>([]); // 识别出来的结果
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // 处理上传图片
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await apiGetImgInfo(formData);
      setOcrList(res.data); // 填入识别结果
    } catch (err: any) {
      alert("识别失败: " + err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  // 代码change，改变基金名称
  const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newList = [...ocrList];
    const item = newList[index];
    if (!item) return;
    item.code = e.target.value;
    if (e.target.value && allStockRegex.test(e.target.value)) {
      const res = await apiGetFundInfo(e.target.value);
      item.name = res.data.fundName;
    }

    setOcrList(newList);
  };

  // 最终确认保存
  const handleConfirm = async () => {
    try {
      // 调用批量添加接口（昨天写的 update-batch）
      await axios.post("/fund/batchAdd", { funds: ocrList });
      onRefresh(); // 刷新主表
      onClose();
    } catch (err) {
      alert("保存失败");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="p-6 bg-white rounded-2xl">
        <h2 className="text-xl font-bold mb-4">图片识别导入</h2>

        {/* 上传区域 */}
        <div className="border-2 border-dashed border-gray-200 p-8 text-center rounded-xl mb-4">
          <input type="file" onChange={handleUpload} id="fileInput" hidden />
          <label htmlFor="fileInput" className="cursor-pointer text-blue-600">
            {loading ? "正在解析中..." : "点击上传支付宝持仓截图"}
          </label>
        </div>

        {/* 识别结果预览表格 */}
        {ocrList.length > 0 && (
          <div className="max-h-60 overflow-y-auto border rounded-xl p-2 mb-4">
            {ocrList.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2 items-center">
                <input
                  className="flex-1 border p-1 rounded"
                  value={item.name}
                  onChange={(e) => {
                    const newList = [...ocrList];
                    newList[index].name = e.target.value;
                    setOcrList(newList);
                  }}
                />
                <input
                  className="w-20 border p-1 rounded font-mono"
                  value={item.code}
                  placeholder="代码"
                  onChange={(e) => handleCodeChange(e, index)}
                />
                <input
                  type="number"
                  className="w-24 border p-1 rounded text-right"
                  value={item.amount}
                  onChange={(e) => {
                    const newList = [...ocrList];
                    newList[index].amount = parseFloat(e.target.value);
                    setOcrList(newList);
                  }}
                />
                <button
                  onClick={() => setOcrList(ocrList.filter((_, i) => i !== index))}
                  className="text-red-500"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg">
            取消
          </button>
          <button
            disabled={ocrList.length === 0}
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            确认存入数据库
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchAddFundModal;
