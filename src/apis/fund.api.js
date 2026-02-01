import request from "../utils/request";

// 获取全部持仓信息
export const apiGetPortfolio = (params = {}) =>
  request({
    method: "get",
    url: "/fund/portfolioReport",
    params,
  });

// 导入基金
export const apiImportFund = (data) =>
  request({
    method: "post",
    url: "/fund/add",
    data,
  });
// 批量导入
export const apiBatchImoportFund = (data) =>
  request({
    method: "post",
    url: "/fund/batchAdd",
    data,
  });

// 根据code获取基金信息
export const apiGetFundInfo = (fundCode) =>
  request({
    method: "get",
    url: `/fund/getInfoByCode/${fundCode}`,
  });

// 上传图片获取持仓数据
export const apiGetImgInfo = (data = {}) =>
  request({
    method: "post",
    url: "/fund/ocrAnalyze",
    data,
  });
