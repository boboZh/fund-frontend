export type ResearchStatus =
  | "uploaded"
  | "parsing"
  | "chunked"
  | "embedding"
  | "embedded"
  | "failed";

export type FilledFrom = "" | "filename" | "pdf";

export interface ResearchSuggestion {
  stockCode: string;
  stockName: string;
  title: string;
  reportDate: string;
  org: string;
}

export interface ResearchDoc extends ResearchSuggestion {
  id: number;
  fileHash: string;
  fileName: string;
  pageCount: number;
  maxChars: number;
  overlapParagraphs: number;
  status: ResearchStatus;
  errorMsg: string | null;
}

export interface ResearchChunk {
  id: number;
  docId: number;
  chunkIndex: number;
  chunkType: "text" | "table" | "summary";
  pageStart: number | null;
  pageEnd: number | null;
  heading: string | null;
  paragraphCount: number;
  content: string;
  charCount: number;
}

export type ResearchMode = "vector" | "keyword" | "hybrid";

export interface ResearchHit {
  rank: number;
  score: number;
  vectorRank: number | null;
  vectorScore: number | null;
  keywordRank: number | null;
  keywordScore: number | null;
  id: number;
  docId: number;
  chunkType: ResearchChunk["chunkType"];
  pageStart: number | null;
  pageEnd: number | null;
  heading: string | null;
  content: string;
  stockCode: string;
  stockName: string;
  title: string;
  org: string;
  reportDate: string;
}

export interface ResearchSearch {
  mode: ResearchMode;
  topK: number;
  stockCode: string | null;
  keywordQuery: string | null;
  hits: ResearchHit[];
}

export interface DroppedLine {
  page: number;
  reason: string;
  text: string;
}

export interface ResearchPreview {
  fileHash: string;
  fileName: string;
  pageCount: number;
  charCount: number;
  suggestion: ResearchSuggestion;
  filledFrom: Record<keyof ResearchSuggestion, FilledFrom>;
  dropped: DroppedLine[];
  duplicateDoc: ResearchDoc | null;
  warning: string;
}
