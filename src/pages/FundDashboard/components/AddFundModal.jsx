import React, { useState } from 'react';
import { X, Upload, Keyboard, Trash2, Plus, Search, Loader2 } from 'lucide-react';

import { apiGetFundInfo, apiGetImgInfo } from '@/apis/fund.api';

const AddFundModal = ({ isOpen, onClose, onConfirm }) => {
  const [mode, setMode] = useState('manual'); // 'manual' | 'ocr' | null
  const [loading, setLoading] = useState(false);
  
  // 手动输入状态
  const [manualData, setManualData] = useState({ code: '', name: '', amount: '' });
  
  // OCR 识别后的列表状态
  const [ocrResults, setOcrResults] = useState([]);

  if (!isOpen) return null;

  // 1. 手动输入：根据代码获取基金名称
  const handleSearchFund = async () => {
    if (manualData.code.length < 6) return;
    setLoading(true);
    try {
      // 假设后端有这个搜索接口
      const res = await apiGetFundInfo(manualData.code);
      if (!res.data.fundName) {
        alert("未找到该基金");
        setManualData({...manualData, name: ''})
      } else {
        setManualData({ ...manualData, name: res.data.fundName });
      }
      
    } catch (e) {
      alert("未找到该基金");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setManualData({ code: '', name: '', amount: '' })
    onClose()
  }

  // 2. 图片识别上传
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('screenshot', file);
    
    setLoading(true);
    try {
      const res = await apiGetImgInfo(formData);
      setOcrResults(res.data.data); // 后端返回识别出的数组
      setMode('ocr');
    } catch (e) {
      alert("识别失败，请重试或手动输入");
    } finally {
      setLoading(false);
    }
  };

  // 修改 OCR 结果中的某一项
  const updateOcrItem = (index, field, value) => {
    const newList = [...ocrResults];
    newList[index][field] = value;
    setOcrResults(newList);
  };

  // 删除 OCR 结果中的某一项
  const removeOcrItem = (index) => {
    setOcrResults(ocrResults.filter((_, i) => i !== index));
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
          {!mode ? (
            /* 模式选择 */
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setMode('manual')}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition group"
              >
                <Keyboard className="w-12 h-12 text-gray-300 group-hover:text-indigo-500 mb-3" />
                <span className="font-bold text-gray-600 group-hover:text-indigo-600">手动输入</span>
              </button>
              
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition group">
                <input type="file" className="hidden" onChange={handleFileUpload} />
                <Upload className="w-12 h-12 text-gray-300 group-hover:text-indigo-500 mb-3" />
                <span className="font-bold text-gray-600 group-hover:text-indigo-600">图片识别</span>
                {loading && <Loader2 className="w-5 h-5 animate-spin mt-2 text-indigo-500" />}
              </label>
            </div>
          ) : mode === 'manual' ? (
            /* 手动输入表单 */
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">基金代码</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="如 001508"
                      value={manualData.code}
                      onChange={(e) => setManualData({...manualData, code: e.target.value})}
                    />
                    <button onClick={handleSearchFund} className="absolute right-2 top-1.5 p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex-[2]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">基金名称</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-gray-50"
                    value={manualData.name}
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
                  onChange={(e) => setManualData({...manualData, amount: e.target.value})}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleClose} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold">取消</button>
                <button 
                  onClick={() => onConfirm([manualData])}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg"
                >
                  确定添加
                </button>
              </div>
            </div>
          ) : (
            /* OCR 结果预览与编辑 */
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {ocrResults.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <input 
                        className="w-full bg-transparent font-bold text-sm outline-none" 
                        value={item.name} 
                        onChange={(e) => updateOcrItem(index, 'name', e.target.value)}
                      />
                      <input 
                        className="text-xs text-gray-400 bg-transparent outline-none" 
                        value={item.code} 
                        placeholder="代码"
                        onChange={(e) => updateOcrItem(index, 'code', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <input 
                        type="number"
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm text-right font-mono" 
                        value={item.amount}
                        onChange={(e) => updateOcrItem(index, 'amount', e.target.value)}
                      />
                    </div>
                    <button onClick={() => removeOcrItem(index)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setMode(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold">返回重新上传</button>
                <button 
                   onClick={() => onConfirm(ocrResults)}
                   className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg"
                >
                  确认导入 {ocrResults.length} 项
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFundModal;