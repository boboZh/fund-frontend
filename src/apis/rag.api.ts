import request, { type ApiResponse } from "../utils/request";
import type { ResearchChunk, ResearchDoc, ResearchPreview, DroppedLine } from "@/types/rag";

export const apiPreviewResearch = (file: File): Promise<ApiResponse<ResearchPreview>> => {
  const formData = new FormData();
  formData.append("file", file);
  return request({
    method: "post",
    url: "/rag/preview",
    data: formData,
    timeout: 60000,
  });
};

export const apiCreateResearch = (data: {
  fileHash: string;
  fileName: string;
  stockCode: string;
  stockName: string;
  title: string;
  reportDate: string;
  org: string;
}): Promise<ApiResponse<{ doc: ResearchDoc; duplicate: boolean }>> =>
  request({
    method: "post",
    url: "/rag/docs",
    data,
  });

export const apiListResearch = (): Promise<ApiResponse<ResearchDoc[]>> =>
  request({
    method: "get",
    url: "/rag/docs",
  });

export const apiGetResearchChunks = (
  id: number,
): Promise<ApiResponse<{ doc: ResearchDoc; chunks: ResearchChunk[]; dropped: DroppedLine[] }>> =>
  request({
    method: "get",
    url: `/rag/docs/${id}/chunks`,
  });

export const apiRechunkResearch = (
  id: number,
  data: { maxChars: number; overlapParagraphs: number },
): Promise<ApiResponse<ResearchDoc>> =>
  request({
    method: "post",
    url: `/rag/docs/${id}/rechunk`,
    data,
  });

export const apiRetryResearch = (id: number): Promise<ApiResponse<ResearchDoc>> =>
  request({
    method: "post",
    url: `/rag/docs/${id}/retry`,
  });

export const apiDeleteResearch = (id: number): Promise<ApiResponse<string>> =>
  request({
    method: "delete",
    url: `/rag/docs/${id}`,
  });
