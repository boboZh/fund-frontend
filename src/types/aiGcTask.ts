export type TaskStatus = "queued" | "generating" | "completed" | "failed";
export type Task = {
  status: TaskStatus;
  taskId: string;
  progress: number;
  [prop: string]: unknown;
};
