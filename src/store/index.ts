import { create } from "zustand";
import createAuthModule, { type AuthSlice } from "./modules/user";
import createChatModule, { type ChatSlice } from "./modules/chat";
import createTaskModule, { type TaskSlice } from "./modules/task";

type StoreState = AuthSlice & ChatSlice & TaskSlice;

// 组合所有的 Slice
const useStore = create<StoreState>((...a) => ({
  ...createAuthModule(...a),
  ...createChatModule(...a),
  ...createTaskModule(...a),
}));

export default useStore;
