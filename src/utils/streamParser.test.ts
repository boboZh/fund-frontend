import { describe, expect, it, vi } from "vitest";
import { flushStreamTail, streamParser } from "./streamParser";

const run = (chunks: string[]) => {
  const content: string[] = [];
  const steps: string[] = [];
  const sources: unknown[] = [];
  let buffer = "";
  chunks.forEach((chunk) => {
    buffer += chunk;
    buffer = streamParser(
      buffer,
      (text) => content.push(text),
      (taskId, status, text) => steps.push(`${taskId}:${status}:${text}`),
      (next) => sources.push(next),
    );
  });
  flushStreamTail(buffer, (text) => content.push(text));
  return { text: content.join(""), steps, sources };
};

describe("streamParser", () => {
  it("步骤条仍然按第一个 ] 结束", () => {
    const { text, steps } = run(["正文[S:task_1:loading:正在检索公司研报]后续"]);
    expect(steps).toEqual(["task_1:loading:正在检索公司研报"]);
    expect(text).toBe("正文后续");
  });

  it("来源标签不进正文，并挂到消息上", () => {
    const payload = {
      sources: [{ ref: 1, title: "广汇能源", org: "开源证券", reportDate: "2026-10-05", page: 7, heading: "产能", content: "目标价 12] 元" }],
    };
    const { text, sources } = run([`根据研报[1]。[CITATIONS]${JSON.stringify(payload)}[/CITATIONS]`]);
    expect(text).toBe("根据研报[1]。");
    expect(sources).toEqual([payload.sources]);
  });

  it("标签被拆成两段时，前半段不会先吐出去", () => {
    const payload = { sources: [{ ref: 1, title: "标题", content: "甲" }] };
    const raw = `[CITATIONS]${JSON.stringify(payload)}[/CITATIONS]`;
    const { text, sources } = run(["答案", raw.slice(0, 8), raw.slice(8)]);
    expect(text).toBe("答案");
    expect(sources).toEqual([payload.sources]);
  });

  it("流结束时半截来源标签不写进正文", () => {
    const update = vi.fn();
    const rest = streamParser("[CITATIONS]{\"sources\":[", update, vi.fn(), vi.fn());
    flushStreamTail(rest, update);
    expect(update).not.toHaveBeenCalled();
  });
});
