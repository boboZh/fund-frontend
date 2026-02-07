import request, { type ApiResponse } from "../utils/request";
import type { AddFundItem, PortfolioData } from "@/types/fund";
// 获取全部持仓信息
export const apiGetPortfolio = (params = {}): Promise<ApiResponse<PortfolioData>> =>
  request({
    method: "get",
    url: "/fund/portfolioReport",
    params,
  });

// 批量导入
export const apiBatchImoportFund = (data: { funds: AddFundItem[] }): Promise<ApiResponse<void>> =>
  request({
    method: "post",
    url: "/fund/batchAdd",
    data,
  });

// 根据code获取基金信息
export const apiGetFundInfo = (
  fundCode: string,
): Promise<ApiResponse<{ fundName: string; [propName: string]: any }>> =>
  request({
    method: "get",
    url: `/fund/getInfoByCode/${fundCode}`,
  });

// 上传图片获取持仓数据
export const apiGetImgInfo = (data: FormData): Promise<ApiResponse<AddFundItem[]>> =>
  request({
    method: "post",
    url: "/fund/ocrAnalyze",
    data,
  });

// 删除单个基金
export const apiDeleteFund = (data: { fundCode: string }): Promise<ApiResponse<void>> =>
  request({
    method: "post",
    url: `/fund/delete`,
    data,
  });

// 设置止盈止损提醒
export const apiSetFundAlert = (data: {
  fundCode: string;
  targetProfitRate: number | string | null;
  stopLossRate: number | string | null;
  applyAll: boolean;
}): Promise<ApiResponse<void>> =>
  request({
    method: "post",
    url: "/fund/setAlert",
    data,
  });
