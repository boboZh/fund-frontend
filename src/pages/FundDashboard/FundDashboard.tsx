import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, TrendingUp, Wallet, AlertCircle, Plus } from "lucide-react";
import AddFundModal from "./components/AddFundModal";
import BatchAddFundModal from "./components/BatchAddModal";
import { apiGetPortfolio, apiBatchImoportFund, apiDeleteFund } from "@/apis/fund.api";
import FundTable, { type Column } from "./components/FundTable";
import { toast } from "sonner";
import type { PortfolioData, FundItem, AddFundItem } from "@/types/fund";
import { textColor } from "@/utils/tools";
import AiAssistant from "@/components/AiAssistant";
import ConfigAlertModal from "./components/ConfigAlertModal";

const Dashbard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  const [data, setData] = useState<PortfolioData | null>(null);
  const [lastUpdated, setLastUpdated] = useState("尚未同步");
  const [curFund, setCurFund] = useState<FundItem | null>(null);
  const [isConfigAlertOpen, setIsConfigAlertOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiGetPortfolio();
      setData(response.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      toast.error("获取数据失败:" + (error instanceof Error ? error.message : String(error)));
    }
  }, []);

  // 自动刷新逻辑
  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 3600000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleAddConfirm = async (newFunds: AddFundItem[]) => {
    try {
      // 这里的 API 需要你在后端实现：接收数组并写入 portfolio.json
      await apiBatchImoportFund({
        funds: newFunds,
      });
      setIsModalOpen(false);
      fetchData(); // 重新加载列表
    } catch (e) {
      toast.error("保存失败: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleDeleteClick = async (fund: FundItem) => {
    try {
      await apiDeleteFund({
        fundCode: fund.code,
      });
      fetchData();
    } catch (error) {
      console.error("删除失败：", error);
    }
  };

  // 类型守卫，如果data为空，则提前返回，这样下面的summary不用做空判断
  if (!data) return <div className="p-10 text-center">正在连接后端服务...</div>;

  // 打开设置提醒
  const emitSetAlert = (fund: FundItem) => {
    setCurFund(fund);
    setIsConfigAlertOpen(true);
  };

  // 定义table列
  // 这里的key和FundItem的字段对应
  const columns: Column<FundItem>[] = [
    {
      name: "基金信息",
      key: "fundName",
      colClassName: "text-gray-800",
    },
    {
      name: "代码",
      key: "fundCode",
      colClassName: "text-gray-400",
    },
    {
      name: "实时预估",
      key: "change",
      colClassName: (fund) => textColor(fund.change),
    },
    {
      name: "持仓金额",
      key: "amount",
      colClassName: "font-black",
    },
    {
      name: "今日收益",
      key: "dailyProfit",
      colClassName: (fund) => textColor(fund.dailyProfit),
    },
    {
      name: "止盈点",
      key: "targetProfitRate",
    },
    {
      name: "止损点",
      key: "stopLossRate",
    },
    {
      name: "操作",
      key: "op",
      colClassName: "font-medium",
      render: (fund) => {
        return (
          <div className="fn-flex align-middle gap-2 flex-nowrap flex-noshrink">
            <button className="" onClick={() => handleDeleteClick(fund)}>
              删除
            </button>
            <button
              className="flex items-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl transition shadow-sm text-nowrap"
              onClick={() => emitSetAlert(fund)}
            >
              设置提醒
            </button>
          </div>
        );
      },
    },
  ];
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
            <span
              className="flex items-center text-gray-700 px-1 py-2.5  transition cursor-pointer "
              onClick={() => setIsModalOpen(true)}
            >
              新增持仓
            </span>
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
              ¥{" "}
              {Number(data.summary.totalAmount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </h2>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <TrendingUp className="absolute right-4 bottom-4 w-16 h-16 text-gray-50" />
            <p className="text-gray-500 text-sm font-medium mb-1">当日预估盈亏</p>
            <h2
              className={`text-4xl font-black ${textColor(Number(data.summary.totalDailyProfit))}`}
            >
              {Number(data.summary.totalDailyProfit).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </h2>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-700">持仓明细</h3>
          </div>
          <FundTable columns={columns} funds={data.funds} />
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

        <AiAssistant funds={data.funds} />

        <ConfigAlertModal
          fund={curFund as FundItem}
          isOpen={isConfigAlertOpen}
          onClose={() => setIsConfigAlertOpen(false)}
          onRefresh={fetchData}
        />
      </div>
    </div>
  );
};

export default Dashbard;
