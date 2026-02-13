import { type StateCreator } from "zustand";
import type { Session } from "@/types/ai";

export interface ChatSlice {
  curSession: Session | null; // 当前会话
  sessions: Session[]; // 所有对话
  setCurSession: (data: Session) => void; // 更新当前会话
}

const createChatModule: StateCreator<ChatSlice> = (set) => ({
  curSession: null,
  sessions: [],

  setCurSession: (data) => {
    set({
      curSession: data,
    });
  },
});

export default createChatModule;
