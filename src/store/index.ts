import { create } from "zustand";
import createAuthModule, { type AuthSlice } from "./modules/user";

type StoreState = AuthSlice;

// 组合所有的 Slice
const useStore = create<StoreState>((...a) => ({
  ...createAuthModule(...a),
}));

export default useStore;
