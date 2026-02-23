import request, { type ApiResponse } from "../utils/request";
import type { Session, AiChatModel } from "@/types/ai";
import type { PageParams } from "@/types";
// 获取会话列表
export const apiGetSessionList = (): Promise<ApiResponse<Session[]>> =>
  request({
    method: "get",
    url: "/ai/session/list",
  });
// 获取对话消息记录
export const apiGetMsgList = (
  data: { sessionId: string } & PageParams,
): Promise<ApiResponse<{ list: AiChatModel[]; hasMore: boolean }>> =>
  request({
    method: "post",
    url: "/ai/message/list",
    data,
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
