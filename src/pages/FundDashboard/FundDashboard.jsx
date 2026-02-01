import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Wallet, AlertCircle, Plus } from 'lucide-react'
import AddFundModal from './components/AddFundModal';
import BatchAddFundModal from './components/BatchAddModal'
import { apiGetPortfolio, apiImportFund, apiBatchImoportFund } from '@/apis/fund.api';

const Dashbard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBatchOpen, setIsBatchOpen] = useState(false)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('尚未同步')

  const handleAddConfirm = async (newFunds) => {
    try {
      // 这里的 API 需要你在后端实现：接收数组并写入 portfolio.json
      await apiBatchImoportFund({
        funds: newFunds
      })
      setIsModalOpen(false);
      fetchData(); // 重新加载列表
    } catch (e) {
      alert("保存失败");
    }
  };


  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiGetPortfolio()
      setData(response.data) 
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('获取数据失败：', error)
    } finally {
      setLoading(false)
    }
  }, []) 

  // 自动刷新逻辑
  useEffect(() => {
    fetchData() 
    const timer = setInterval(fetchData, 360000)
    return ()=> clearInterval(timer) 
  }, [fetchData]) 
  
  if (!data) return <div className='p-10 text-center'>正在连接后端服务...</div>

  const isUp = (val) => {
    if([null, undefined, '-', '--', 0].includes(val)) return 0
    const _val = parseFloat(val) 
    return _val > 0? 1: -1
  }
  const textColor = (val) => {
    const up = isUp(val)  
    if (up > 0) return 'text-red-500'
    if(up<0) return 'text-green-500'
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">基金投资看板</h1>
            <p className="text-sm text-gray-500 mt-1">
              更新时间: <span className="font-mono">{lastUpdated}</span>
            </p>
          </div>
          <div className="flex gap-3">
            {/* 新增添加按钮 */}
              <span className="flex items-center text-gray-700 px-1 py-2.5  transition cursor-pointer "  onClick={() => setIsModalOpen(true)}>新增持仓</span>
             <button 
                onClick={() => setIsBatchOpen(true)}
                className="flex items-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl transition shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                批量导入
              </button>

              <button 
                onClick={fetchData}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition shadow-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                立即刷新
              </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <Wallet className="absolute right-4 bottom-4 w-16 h-16 text-gray-50" />
            <p className="text-gray-500 text-sm font-medium mb-1">总持仓金额 (元)</p>
            <h2 className="text-4xl font-black text-gray-900">
              ¥ {Number(data.summary.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <TrendingUp className="absolute right-4 bottom-4 w-16 h-16 text-gray-50" />
            <p className="text-gray-500 text-sm font-medium mb-1">当日预估盈亏</p>
            <h2 className={`text-4xl font-black ${ textColor(Number(data.summary.totalDailyProfit))}`}>
              {Number(data.summary.totalDailyProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-700">持仓明细</h3>
            
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-8 py-4 font-semibold">基金信息</th>
                  <th className="px-8 py-4 font-semibold text-right">实时预估</th>
                  <th className="px-8 py-4 font-semibold text-right">持仓金额</th>
                  <th className="px-8 py-4 font-semibold text-right">今日收益</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {data.funds.map((fund) => {
                  

                  
                  return (
                    <tr key={fund.code} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-bold text-gray-800">{fund.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{fund.code}</div>
                      </td>
                      <td className={`px-8 py-5 text-right font-bold ${textColor(fund.change)}`}>
 {fund.change}
                      </td>
                      <td className="px-8 py-5 text-right font-medium text-gray-600">
                        ¥{Number(fund.marketValue).toLocaleString()}
                      </td>
                      <td className={`px-8 py-5 text-right font-black ${textColor(Number(fund.dailyProfit))}`}>
                        {isUp(fund.dailyProfit) ? Number(fund.dailyProfit).toLocaleString(): '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warn Tips */}
        <div className="mt-10 flex flex-col items-center space-y-2">
          <div className="flex items-center text-gray-400 text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            跌的第一天不要补 • 建仓最多两千 • 优十普五准备跑
          </div>
          <p className="text-xs text-gray-300">—— 跌涨幅为预估，仅做参考 ——</p>
        </div>

        <AddFundModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleAddConfirm}
        />
        <BatchAddFundModal 
          isOpen={isBatchOpen} 
          onClose={() => setIsBatchOpen(false)}
          onRefresh={fetchData}
        />
      </div>
    </div>
  );
}

export default Dashbard