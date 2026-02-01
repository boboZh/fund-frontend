import { create } from "zustand";
import createAuthModule from "./modules/user";

// 组合所有的 Slice
const useStore = create((...a) => ({
  ...createAuthModule(...a),
}));

export default useStore;
