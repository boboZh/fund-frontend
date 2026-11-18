import { describe, expect, it } from "vitest";
import type { ResearchCitation } from "@/types/ai";
import { citedResearchSources } from "./researchCitations";

const sources: ResearchCitation[] = [1, 2, 3].map((ref) => ({
  ref,
  title: `研报${ref}`,
  org: "机构",
  reportDate: "2026-11-18",
  page: 1,
  heading: null,
  content: "片段",
}));

describe("citedResearchSources", () => {
  it("联网标识与研报分开匹配，只保留实际引用的网页", () => {
    const web: ResearchCitation = { ...sources[0], type: "web", url: "https://example.com" };
    expect(citedResearchSources("联网结论[W1]。", [sources[0], web])).toEqual([web]);
    expect(citedResearchSources("研报观点[1]。", [sources[0], web])).toEqual([sources[0]]);
    expect(citedResearchSources("研报[1][W1]。", [sources[0], web])).toEqual([sources[0], web]);
  });
  it("检索到了候选但正文未引用时，不展示来源", () => {
    expect(citedResearchSources("没有找到相关研报。", sources)).toEqual([]);
  });

  it("只保留引用的来源，重复引用不重复展示，也不重新编号", () => {
    expect(citedResearchSources("观点[3]。另一观点[1][3]。", sources)).toEqual([
      sources[0], sources[2],
    ]);
  });

  it("正文中不存在的来源编号不会生成来源", () => {
    expect(citedResearchSources("观点[9]。", sources)).toEqual([]);
  });

  it("联网来源的 Markdown 链接不会被当成研报引用", () => {
    expect(citedResearchSources("来源[1](https://example.com)。[2][web]", sources)).toEqual([]);
  });

  it("没有来源和流式输出尚未完成的引用均可处理", () => {
    expect(citedResearchSources("观点[1]", null)).toEqual([]);
    expect(citedResearchSources("观点[1]", undefined)).toEqual([]);
    expect(citedResearchSources("观点[", sources)).toEqual([]);
  });
});
