export type AiTaskType = "idle" | "thinking" | "searching";
export type AiTaskStatus = "loading" | "success" | "error" | "abort";

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
  id: string;
  status?: "success" | "abort" | "error";
}

export interface Session {
  title: string;
  sessionId: string;
  isVirtual?: boolean;
}
