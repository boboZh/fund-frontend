import { create } from "zustand";
import createAuthModule, { type AuthSlice } from "./modules/user";
import createChatModule, { type ChatSlice } from "./modules/chat";
import createTaskModule, { type TaskSlice } from "./modules/task";
import createUploadModule, { type UploadSlice } from "./modules/upload";
import createVideoModule, { type VideoSlice } from "./modules/video";

type StoreState = AuthSlice & ChatSlice & TaskSlice & UploadSlice & VideoSlice;

// 组合所有的 Slice
const useStore = create<StoreState>((...a) => ({
  ...createAuthModule(...a),
  ...createChatModule(...a),
  ...createTaskModule(...a),
  ...createUploadModule(...a),
  ...createVideoModule(...a),
}));

export default useStore;
