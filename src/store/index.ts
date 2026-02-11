import { create } from "zustand";
import createAuthModule, { type AuthSlice } from "./modules/user";
import createChatModule, { type ChatSlice } from "./modules/chat";

type StoreState = AuthSlice | ChatSlice;

// 组合所有的 Slice
const useStore = create<StoreState>((...a) => ({
  ...createAuthModule(...a),
  ...createChatModule(...a),
}));

export default useStore;
