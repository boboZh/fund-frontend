import { type StateCreator } from "zustand";

export interface UploadSlice {
  progress: number;
  status: "idle" | "calculating" | "uploading" | "merging" | "success" | "error";
  setProgress: (p: number) => void;
  setStatus: (s: UploadSlice["status"]) => void;
}
const createUploadModule: StateCreator<UploadSlice> = (set) => ({
  progress: 0,
  status: "idle",
  setProgress: (progress) => set({ progress }),
  setStatus: (status) => set({ status }),
});

export default createUploadModule;
