import { describe, expect, it, vi } from "vitest";
import type { AiChatModel } from "@/types/ai";

vi.mock("@/store", () => ({ default: vi.fn() }));
vi.mock("@/utils/myFetch", () => ({ myFetch: vi.fn() }));

import { applyPending } from "./useChatStream";

const pending = { id: "active", content: "正文", stepUpdates: [], sources: null, status: null };
const active: AiChatModel = { id: "active", role: "ai", content: "", isStreaming: true };

describe("气泡流状态", () => {
  it("正文和工具完成通知不结束气泡生成状态", () => {
    const result = applyPending([active], {
      ...pending, stepUpdates: [{ taskId: "search", status: "success", text: "检索完成" }],
    });
    expect(result[0].isStreaming).toBe(true);
    expect(result[0].content).toBe("正文");
  });

  it.each(["success", "abort", "error"] as const)("只有气泡终态 %s 才解除生成状态", (status) => {
    const result = applyPending([active], { ...pending, status });
    expect(result[0]).toMatchObject({ content: "正文", status, isStreaming: false });
  });

  it("迟到的终态不会修改另一条消息", () => {
    const messages = [{ ...active, id: "other" }];
    expect(applyPending(messages, { ...pending, status: "success" })).toBe(messages);
  });
});
