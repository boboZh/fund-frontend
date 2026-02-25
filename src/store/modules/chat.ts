import { type StateCreator } from "zustand";
import type { Session } from "@/types/ai";
import { apiGetSessionList, apiDeleteSession } from "@/apis/ai.api";
import { toast } from "sonner";

export interface ChatSlice {
  sessions: Session[];
  isLoadingList: boolean; // 加载列表的锁
  getSessionList: (force?: boolean) => void; // 获取对话列表
  deleteSession: (sid: string) => Promise<Session[]>; // 删除单个会话
  isInitialLoaded: boolean;
}

const createChatModule: StateCreator<ChatSlice> = (set, get) => ({
  curSession: null,
  isInitialLoaded: false,
  isLoadingList: false,
  sessions: [],
  // 获取会话列表
  getSessionList: async (force = false) => {
    if (get().isLoadingList) return;
    if (!force && get().isInitialLoaded) return;
    set({
      isLoadingList: true,
    });
    try {
      const result = await apiGetSessionList();
      set({
        sessions: result.data,
        isInitialLoaded: true,
        isLoadingList: false,
      });
    } catch (err) {
      set({ isLoadingList: false });
      toast.error("获取对话列表失败 " + (err instanceof Error ? err.message : ""));
    }
  },

  // 删除单个会话
  deleteSession: async (sessionId) => {
    await apiDeleteSession(sessionId);
    const nextSessions = get().sessions.filter((item) => item.sessionId !== sessionId);

    set({
      sessions: nextSessions,
    });
    return nextSessions;
  },
});

export default createChatModule;
