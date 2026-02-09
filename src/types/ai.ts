export type AiStatus = "idle" | "thinking" | "searching" | "error";

export interface MessageStep {
  type: AiStatus;
  content: string;
}

export interface AiChatModel {
  content: string;
  role: "ai" | "user";
  steps: MessageStep[];
  currentStatus: AiStatus;
}
