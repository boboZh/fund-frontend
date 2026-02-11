import { type StateCreator } from "zustand";
import type { Session } from "@/types/ai";

export interface ChatSlice {
  curSession: Session | null; // 当前会话
  setCurSession: (data: Session) => void; // 更新当前会话
}

const createChatModule: StateCreator<ChatSlice> = (set) => ({
  curSession: null,

  setCurSession: (data) => {
    set({
      curSession: data,
    });
  },
});

export default createChatModule;
