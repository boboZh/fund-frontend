import type { ResearchCitation } from "@/types/ai";

export const citationKey = (source: ResearchCitation) =>
  source.type === "web" ? `W${source.ref}` : String(source.ref);

// 研报用 [1]，联网用 [W1]；普通 Markdown 链接不算引用。
export const citedResearchSources = (
  content: string,
  sources: ResearchCitation[] | null | undefined,
) => {
  const refs = new Set(
    Array.from(content.matchAll(/\[(W?\d+)\](?!\(|\[(?!W?\d+\]))/g), (match) => match[1]),
  );
  return (sources || []).filter((source) => refs.has(citationKey(source)));
};
