import { type StateCreator } from "zustand";
import type { Task } from "@/types/aiGcTask";
export interface TaskSlice {
  tasks: {
    [prop: string]: Task;
  };
  addTask: (id: string, metaData: Task) => void;
  updateTask: (id: string, metaData: Task) => void;
}
const createTaskModule: StateCreator<TaskSlice> = (set) => ({
  tasks: {},

  addTask: (taskId, metaData) => {
    set((state) => {
      return {
        tasks: {
          ...state.tasks,
          [taskId]: { status: "queued", progress: 0, ...metaData },
        },
      };
    });
  },
  updateTask: (taskId, updateData) => {
    set((state) => {
      if (!state.tasks[taskId]) return state;
      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...state.tasks[taskId],
            ...updateData,
          },
        },
      };
    });
  },
});

export default createTaskModule;
