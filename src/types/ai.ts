export type AiTaskType = "idle" | "thinking" | "searching";
export type AiTaskStatus = "loading" | "success" | "error" | "abort";

export interface MessageStep {
  taskType?: AiTaskType;
  text: string;
  id: string;
  status: AiTaskStatus;
}

export interface ResearchCitation {
  type?: "web";
  url?: string;
  publishedDate?: string | null;
  id?: number;
  ref: number;
  title: string;
  org: string;
  reportDate: string;
  page: number | null;
  heading: string | null;
  content: string;
}

export interface AiChatModel {
  isStreaming?: boolean;
  content: string;
  role: "ai" | "user";
  steps?: MessageStep[];
  sources?: ResearchCitation[] | null;
  id: string;
  status?: "success" | "abort" | "error";
}

export interface Session {
  title: string;
  sessionId: string;
  isVirtual?: boolean;
}
