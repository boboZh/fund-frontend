import { type StateCreator } from "zustand";
import type { Session } from "@/types/ai";
import { generateSessionId } from "@/utils/tools";
import { apiGetSessionList, apiDeleteSession } from "@/apis/ai.api";
import { toast } from "sonner";

export interface ChatSlice {
  sessions: Session[];
  getSessionList: () => void; // 获取对话列表
  startNewSession: () => string; // 创建新对话
  setCurSession: (data: Session) => void; // 更新当前会话
  deleteSession: (sid: string) => void; // 删除单个会话
}

const createChatModule: StateCreator<ChatSlice> = (set) => ({
  curSession: null,
  sessions: [],
  // 获取会话列表
  getSessionList: async () => {
    try {
      const result = await apiGetSessionList();
      console.log("data: ", result);
      set({
        sessions: result.data,
      });
    } catch (err) {
      toast.error("获取对话列表失败 " + (err instanceof Error ? err.message : ""));
    }
  },
  // 创建新的会话
  startNewSession: () => {
    const sessionId = generateSessionId();
    const newSession = {
      sessionId,
      title: "新对话",
    };
    set((state) => {
      return {
        curSession: newSession,
        sessions: [newSession, ...state.sessions],
      };
    });
    return sessionId;
  },
  // 设置当前会话
  setCurSession: (data) => {
    set({
      curSession: data,
    });
  },
  // 删除单个会话
  deleteSession: async (sessionId) => {
    try {
      await apiDeleteSession(sessionId);
      set((state) => {
        const nextSessions = state.sessions.filter((item) => item.sessionId !== sessionId);
        const isDeletingCur = sessionId === state.curSession?.sessionId;
        return {
          sessions: nextSessions,
          curSession: isDeletingCur ? nextSessions[0] || null : state.curSession,
        };
      });
      toast.success("会话已删除");
    } catch (err) {
      console.error("会话删除失败：", err);
      toast.error("删除失败，请稍后再试");
    }
  },
});

export default createChatModule;
