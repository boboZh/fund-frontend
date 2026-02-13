export type AiTaskType = "idle" | "thinking" | "searching";
export type AiTaskStatus = "loading" | "success" | "error";

export interface MessageStep {
  taskType?: AiTaskType;
  text: string;
  id: string;
  status: AiTaskStatus;
}

export interface AiChatModel {
  content: string;
  role: "ai" | "user";
  steps?: MessageStep[];
}

export interface Session {
  title: string;
  sessionId: string;
}
