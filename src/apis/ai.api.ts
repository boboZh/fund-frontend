import request, { type ApiResponse } from "../utils/request";
import type { Session } from "@/types/ai";
// 登录
export const apiGetSessionList = (): Promise<ApiResponse<Session[]>> =>
  request({
    method: "get",
    url: "/ai/session-list",
  });
