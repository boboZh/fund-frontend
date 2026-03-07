import request, { type ApiResponse } from "../utils/request";

// 验证文件状态: 需要接着上传，还是已经上传成功
export const apiVerifyFileStatus = (data: {
  fileHash: string;
  fileName: string;
}): Promise<ApiResponse<{ shouldUpload: boolean; uploadedChunks: [] }>> =>
  request({
    method: "post",
    data,
    url: "/file/verify",
  });
// 上传
export const apiUpload = (formData: FormData): Promise<ApiResponse<void>> =>
  request({
    method: "post",
    data: formData,
    url: "/file/upload/chunk",
  });
// 合并切片
export const apiMergeFile = (data: {
  fileHash: string;
  fileName: string;
  size: number;
}): Promise<ApiResponse<void>> =>
  request({
    method: "post",
    data,
    url: "/file/merge",
  });
