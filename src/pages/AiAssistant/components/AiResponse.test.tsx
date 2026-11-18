import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AiResponse from "./AiResponse";
import type { ResearchCitation } from "@/types/ai";

const web: ResearchCitation = {
  type: "web", ref: 2, title: "公司公告", url: "https://example.com/report",
  org: "", reportDate: "", page: null, heading: null, content: "网页摘要",
};

describe("AiResponse 网页引用", () => {
  it("流式和已完成消息均可直接打开网页，不渲染底部来源", () => {
    for (const status of [undefined, "success"] as const) {
      const html = renderToStaticMarkup(<AiResponse model={{ id: "stream", role: "ai", status, content: "趋势分析。[W2]", sources: [web] }} />);
      expect(html).toContain('href="https://example.com/report"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('aria-label="打开联网来源 W2：公司公告"');
      expect(html).not.toContain('id="source-stream-W2"');
      expect(html).not.toContain("border-t");
      expect(html).not.toContain('disabled=""');
    }
  });

  it("研报来源等气泡完成后展示，生成中禁用跳转但联网图标可直接打开", () => {
    const research = { ...web, type: undefined, url: undefined, ref: 1, title: "研报来源" };
    const model = { id: "mixed", role: "ai" as const, content: "研报[1]，网页[W2]。", sources: [research, web] };
    const streaming = renderToStaticMarkup(<AiResponse model={{ ...model, isStreaming: true }} />);
    expect(streaming).not.toContain('id="source-mixed-1"');
    expect(streaming).not.toContain("border-t");
    expect(streaming).toContain('disabled=""');
    expect(streaming).toContain('href="https://example.com/report"');
    const finished = renderToStaticMarkup(<AiResponse model={{ ...model, isStreaming: false }} />);
    expect(finished).toContain('id="source-mixed-1"');
    expect(finished).not.toContain('disabled=""');
    expect(finished).not.toContain('id="source-mixed-W2"');
  });

  it("不允许危险协议的网页链接", () => {
    const html = renderToStaticMarkup(<AiResponse model={{ id: "bad", role: "ai", content: "结论[W2]", sources: [{ ...web, url: "javascript:alert(1)" }] }} />);
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('target="_blank"');
  });

  it("未被引用的网页不展示，旧版研报仍可渲染", () => {
    const research = { ...web, type: undefined, url: undefined, ref: 1, title: "历史研报" };
    const html = renderToStaticMarkup(<AiResponse model={{ id: "old", role: "ai", content: "结论[1]。", sources: [research, web] }} />);
    expect(html).toContain("历史研报");
    expect(html).toContain('aria-label="查看研报来源 1"');
    expect(html).not.toContain("https://example.com");
  });
});
