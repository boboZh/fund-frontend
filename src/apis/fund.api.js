import request from "../utils/request";

// 获取全部持仓信息
export const apiGetPortfolio = (params = {}) =>
  request({
    method: "get",
    url: "/portfolio",
    params,
  });

// 建仓
export const apiImportFund = (data) =>
  request({
    method: "post",
    url: "",
    data,
  });

// 根据code获取基金信息
export const apiGetFundInfo = (fundCode) =>
  request({
    method: "get",
    url: `/fund-info/${fundCode}`,
  });

// 上传图片获取持仓数据
export const apiGetImgInfo = (data = {}) =>
  request({
    method: "post",
    url: "/upload-screenshot",
    data,
  });
