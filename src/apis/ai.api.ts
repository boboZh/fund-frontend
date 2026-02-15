import request, { type ApiResponse } from "../utils/request";
import type { Session, AiChatModel } from "@/types/ai";
// 获取会话列表
export const apiGetSessionList = (): Promise<ApiResponse<Session[]>> =>
  request({
    method: "get",
    url: "/ai/session/list",
  });
// 获取对话消息记录
export const apiGetMsgList = (sessionId: string): Promise<ApiResponse<AiChatModel[]>> =>
  request({
    method: "get",
    url: "/ai/message/list",
    params: {
      sessionId,
    },
  });
// 删除会话
export const apiDeleteSession = (sessionId: string): Promise<void> =>
  request({
    method: "post",
    url: "/ai/session/delete",
    data: {
      sessionId,
    },
  });
