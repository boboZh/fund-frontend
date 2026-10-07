import React, { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import {
  apiCreateResearch,
  apiDeleteResearch,
  apiGetResearchChunks,
  apiListResearch,
  apiPreviewResearch,
  apiRechunkResearch,
  apiRetryResearch,
} from "@/apis/rag.api";
import type {
  DroppedLine,
  FilledFrom,
  ResearchChunk,
  ResearchDoc,
  ResearchSuggestion,
} from "@/types/rag";

const EMPTY_FORM: ResearchSuggestion = {
  stockCode: "",
  stockName: "",
  title: "",
  reportDate: "",
  org: "",
};

const STATUS_TEXT: Record<ResearchDoc["status"], string> = {
  uploaded: "已上传",
  parsing: "解析中",
  chunked: "已切块",
  embedding: "向量化中",
  embedded: "已完成",
  failed: "失败",
};

const CHUNK_TYPE_TEXT = {
  text: "正文",
  table: "表格",
  summary: "核心数据",
};

const HINT_TEXT: Record<FilledFrom, string> = {
  "": "",
  filename: "识别自文件名",
  pdf: "识别自正文",
};

const errorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

const pageLabel = (chunk: ResearchChunk) => {
  if (!chunk.pageStart) return "";
  if (!chunk.pageEnd || chunk.pageStart === chunk.pageEnd) return `第 ${chunk.pageStart} 页`;
  return `第 ${chunk.pageStart}-${chunk.pageEnd} 页`;
};

const RagLab: React.FC = () => {
  const [form, setForm] = useState<ResearchSuggestion>(EMPTY_FORM);
  const [hints, setHints] = useState<Record<keyof ResearchSuggestion, FilledFrom>>({
    stockCode: "",
    stockName: "",
    title: "",
    reportDate: "",
    org: "",
  });
  const [fileHash, setFileHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [warning, setWarning] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docs, setDocs] = useState<ResearchDoc[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [chunks, setChunks] = useState<ResearchChunk[]>([]);
  const [dropped, setDropped] = useState<DroppedLine[]>([]);
  const [maxChars, setMaxChars] = useState(800);
  const [overlap, setOverlap] = useState(1);
  const [rechunking, setRechunking] = useState(false);

  const pending = docs.some((doc) => ["uploaded", "parsing", "embedding"].includes(doc.status));
  const activeDoc = docs.find((doc) => doc.id === activeId) || null;

  useEffect(() => {
    let stop = false;
    let timer = 0;
    const tick = async () => {
      try {
        const result = await apiListResearch();
        if (stop) return;
        const list = result.data || [];
        setDocs(list);
        if (list.some((doc) => ["uploaded", "parsing", "embedding"].includes(doc.status))) {
          timer = window.setTimeout(tick, 2000);
        }
      } catch (err) {
        if (!stop) toast.error(errorMessage(err, "获取研报列表失败"));
      }
    };
    tick();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [refreshKey]);

  const loadChunks = useCallback(async (id: number) => {
    try {
      const result = await apiGetResearchChunks(id);
      setChunks(result.data.chunks || []);
      setDropped(result.data.dropped || []);
      setMaxChars(result.data.doc.maxChars || 800);
      setOverlap(result.data.doc.overlapParagraphs ?? 1);
    } catch (err) {
      toast.error(errorMessage(err, "获取切块失败"));
    }
  }, []);

  useEffect(() => {
    if (!activeId || activeDoc?.status === "parsing") return;
    loadChunks(activeId);
  }, [activeId, activeDoc?.status, loadChunks]);

  const updateField =
    (key: keyof ResearchSuggestion) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
      setHints((prev) => ({ ...prev, [key]: "" }));
    };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("只支持 PDF");
      return;
    }
    setPreviewing(true);
    setWarning("");
    try {
      const result = await apiPreviewResearch(file);
      const preview = result.data;
      setFileHash(preview.fileHash);
      setFileName(preview.fileName);
      setForm(preview.suggestion);
      setHints(preview.filledFrom);
      setWarning(preview.warning || "");
      if (preview.duplicateDoc) {
        toast.info(`《${preview.duplicateDoc.title || preview.fileName}》已经入库`);
        setActiveId(preview.duplicateDoc.id);
        setRefreshKey((value) => value + 1);
      }
    } catch (err) {
      toast.error(errorMessage(err, "解析 PDF 失败"));
    } finally {
      setPreviewing(false);
    }
  };

  const canSave =
    Boolean(fileHash) &&
    /^\d{6}$/.test(form.stockCode.trim()) &&
    Boolean(form.stockName.trim()) &&
    Boolean(form.title.trim()) &&
    Boolean(form.reportDate) &&
    Boolean(form.org.trim());

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const result = await apiCreateResearch({
        fileHash,
        fileName,
        stockCode: form.stockCode.trim(),
        stockName: form.stockName.trim(),
        title: form.title.trim(),
        reportDate: form.reportDate,
        org: form.org.trim(),
      });
      if (result.data.duplicate) {
        toast.info("这份研报已经入库");
      }
      setActiveId(result.data.doc.id);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      toast.error(errorMessage(err, "保存研报失败"));
    } finally {
      setSaving(false);
    }
  };

  const handleRechunk = async () => {
    if (!activeId) return;
    setRechunking(true);
    try {
      await apiRechunkResearch(activeId, { maxChars, overlapParagraphs: overlap });
      setChunks([]);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      toast.error(errorMessage(err, "重新切块失败"));
    } finally {
      setRechunking(false);
    }
  };

  const handleRetry = async (id: number) => {
    try {
      await apiRetryResearch(id);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      toast.error(errorMessage(err, "重试失败"));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDeleteResearch(id);
      if (activeId === id) {
        setActiveId(null);
        setChunks([]);
        setDropped([]);
      }
      setRefreshKey((value) => value + 1);
    } catch (err) {
      toast.error(errorMessage(err, "删除失败"));
    }
  };

  return (
    <div className="h-full overflow-hidden flex bg-white text-gray-900">
      <section className="w-[420px] shrink-0 border-r border-gray-200 h-full overflow-y-auto p-5 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">研报入库</h1>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            选择 PDF
            后，会从文件名和首页文字里识别代码、名称、标题、日期和机构。识别到的内容会填进表单，都可以改。
          </p>
        </div>

        <label className="flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
          {previewing ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          {previewing ? "正在识别…" : "选择研报 PDF"}
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFile}
            disabled={previewing}
          />
        </label>
        {fileName && <p className="text-xs text-gray-500 truncate">{fileName}</p>}
        {warning && <p className="text-xs text-amber-600 leading-relaxed">{warning}</p>}

        <div className="space-y-3">
          {(
            [
              ["stockCode", "股票代码", "600256"],
              ["stockName", "股票名称", "广汇能源"],
              ["title", "研报标题", ""],
              ["org", "机构", "开源证券"],
            ] as const
          ).map(([key, label, placeholder]) => (
            <label key={key} className="block">
              <span className="text-xs text-gray-500">{label}</span>
              <input
                value={form[key]}
                placeholder={placeholder}
                onChange={updateField(key)}
                className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              />
              {hints[key] && (
                <span className="mt-1 block text-xs text-indigo-500">{HINT_TEXT[hints[key]]}</span>
              )}
            </label>
          ))}
          <label className="block">
            <span className="text-xs text-gray-500">报告日期</span>
            <input
              type="date"
              value={form.reportDate}
              onChange={updateField("reportDate")}
              className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
            {hints.reportDate && (
              <span className="mt-1 block text-xs text-indigo-500">
                {HINT_TEXT[hints.reportDate]}
              </span>
            )}
          </label>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full h-10 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:bg-gray-200 disabled:text-gray-400"
        >
          {saving ? "正在入库…" : "确认入库"}
        </button>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">已入库</h2>
            {pending && <Loader2 size={14} className="animate-spin text-gray-400" />}
          </div>
          {docs.length === 0 && <p className="text-xs text-gray-400">还没有研报</p>}
          {docs.map((doc) => (
            <div
              key={doc.id}
              className={`rounded-xl border px-3 py-2 ${
                doc.id === activeId ? "border-indigo-300 bg-indigo-50/40" : "border-gray-200"
              }`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setActiveId(doc.id)}
              >
                <div className="text-sm font-medium truncate">{doc.title || doc.fileName}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {doc.stockName} {doc.stockCode} · {doc.org} · {doc.reportDate}
                </div>
                <div
                  className={`mt-1 text-xs ${doc.status === "failed" ? "text-red-500" : "text-gray-400"}`}
                >
                  {STATUS_TEXT[doc.status]}
                  {doc.errorMsg ? `：${doc.errorMsg}` : ""}
                </div>
              </button>
              <div className="mt-2 flex gap-3 text-xs">
                {doc.status === "failed" && (
                  <button
                    type="button"
                    className="text-indigo-600"
                    onClick={() => handleRetry(doc.id)}
                  >
                    重试
                  </button>
                )}
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-500 inline-flex items-center gap-1"
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 size={12} /> 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex-1 h-full overflow-y-auto p-6">
        {!activeDoc && <p className="text-sm text-gray-400">入库后在这里查看切出来的段落。</p>}
        {activeDoc && (
          <>
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold break-words">{activeDoc.title}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {activeDoc.stockName}（{activeDoc.stockCode}）· {activeDoc.org} ·{" "}
                  {activeDoc.reportDate}
                  {activeDoc.pageCount ? ` · ${activeDoc.pageCount} 页` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-xs text-gray-500">
                  合并上限
                  <input
                    type="number"
                    min={400}
                    max={1200}
                    value={maxChars}
                    onChange={(event) => setMaxChars(Number(event.target.value))}
                    className="mt-1 block w-24 h-9 px-2 rounded-lg border border-gray-200 text-sm text-gray-900"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  段落重叠
                  <select
                    value={overlap}
                    onChange={(event) => setOverlap(Number(event.target.value))}
                    className="mt-1 block w-32 h-9 px-2 rounded-lg border border-gray-200 text-sm text-gray-900"
                  >
                    <option value={0}>不重叠</option>
                    <option value={1}>重复上一段</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleRechunk}
                  disabled={rechunking || activeDoc.status === "parsing"}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm whitespace-nowrap disabled:text-gray-300"
                >
                  {rechunking || activeDoc.status === "parsing" ? "切块中…" : "重新切块"}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {activeDoc.status === "parsing" && (
                <p className="text-sm text-gray-500">正在按段落切块…</p>
              )}
              {activeDoc.status !== "parsing" && chunks.length === 0 && (
                <p className="text-sm text-gray-400">还没有切块</p>
              )}
              {chunks.map((chunk) => (
                <article key={chunk.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>#{chunk.chunkIndex + 1}</span>
                    <span>{CHUNK_TYPE_TEXT[chunk.chunkType]}</span>
                    {chunk.heading && <span>{chunk.heading}</span>}
                    <span>{pageLabel(chunk)}</span>
                    <span>{chunk.paragraphCount} 段</span>
                    <span>{chunk.charCount} 字</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                    {chunk.content}
                  </p>
                </article>
              ))}
            </div>

            {dropped.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-500">去掉的页眉、页码和声明</h3>
                <ul className="mt-2 space-y-1 text-xs text-gray-400">
                  {dropped.map((item, index) => (
                    <li key={`${item.page}-${item.reason}-${index}`}>
                      第 {item.page} 页 · {item.reason} · {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default RagLab;
