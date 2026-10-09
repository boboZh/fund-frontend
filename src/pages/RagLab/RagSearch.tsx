import React, { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { apiSearchResearch } from "@/apis/rag.api";
import { MIN_SCORE_RANGE, type ResearchHit, type ResearchMode } from "@/types/rag";

const MODE_OPTIONS: { value: ResearchMode; label: string }[] = [
  { value: "vector", label: "向量" },
  { value: "keyword", label: "关键词" },
  { value: "hybrid", label: "混合" },
];

const MODE_HINT: Record<ResearchMode, string> = {
  vector: "按问题和段落的相似度，在当前账号已入库的研报里取前几条。",
  keyword: "按全文里的词和数字取前几条。用来限定范围的股票代码会从关键词里去掉。",
  hybrid: "向量和关键词各先取 20 条，按名次合并后，再留下前几条。",
};

const rankText = (value: number | null) => (value == null ? "—" : String(value));

const scoreText = (value: number | null, digits = 3) =>
  value == null || Number.isNaN(value) ? "—" : value.toFixed(digits);

const errorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

const pageLabel = (item: { pageStart: number | null; pageEnd: number | null }) => {
  if (!item.pageStart) return "";
  if (!item.pageEnd || item.pageStart === item.pageEnd) return `第 ${item.pageStart} 页`;
  return `第 ${item.pageStart}-${item.pageEnd} 页`;
};

const RagSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<ResearchMode>("hybrid");
  const [rerank, setRerank] = useState(false);
  const [minScore, setMinScore] = useState(String(MIN_SCORE_RANGE.min));
  const [topK, setTopK] = useState(5);
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<ResearchHit[] | null>(null);
  const [resultMode, setResultMode] = useState<ResearchMode>("hybrid");
  const [resultRerank, setResultRerank] = useState(false);
  const [matchedCode, setMatchedCode] = useState<string | null>(null);
  const [keywordQuery, setKeywordQuery] = useState<string | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query || searching) return;
    const threshold = rerank && minScore.trim() !== "" ? Number(minScore) : undefined;
    if (threshold != null && !Number.isFinite(threshold)) {
      toast.error("阈值需要是数字");
      return;
    }
    setSearching(true);
    try {
      const result = await apiSearchResearch({
        query,
        topK,
        mode,
        rerank,
        minScore: threshold,
      });
      const rows = result.data.rerank ? result.data.ranked || [] : result.data.hits || [];
      setHits(rows);
      setResultRerank(Boolean(result.data.rerank));
      setResultMode(result.data.mode);
      setMatchedCode(result.data.stockCode);
      setKeywordQuery(result.data.keywordQuery);
      setSearchedQuery(query);
    } catch (err) {
      toast.error(errorMessage(err, "检索失败"));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-white text-gray-900 p-6">
      <div className="shrink-0 max-w-3xl">
        <h1 className="text-lg font-semibold">检索</h1>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">{MODE_HINT[mode]}</p>
        <div className="mt-4 flex gap-2">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              onClick={() => setMode(option.value)}
              className={`h-8 px-3 rounded-lg text-sm ${
                mode === option.value
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 text-gray-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {rerank && (
          <p className="mt-2 text-xs text-gray-500">
            问题和召回的前 20 条放在一起打分。低于阈值的结果变灰，仍留在表里。这批评测里阈值取{" "}
            {MIN_SCORE_RANGE.min} 到 {MIN_SCORE_RANGE.max}，默认用下沿。
          </p>
        )}
        <textarea
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="例如：广汇能源（600256）的目标价是多少"
          rows={4}
          className="mt-4 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
        />
        <div className="mt-3 flex items-end gap-3">
          <button
            type="button"
            aria-pressed={rerank}
            onClick={() => setRerank((value) => !value)}
            className={`h-9 px-3 rounded-lg text-sm ${
              rerank ? "bg-indigo-600 text-white" : "border border-gray-200 text-gray-600"
            }`}
          >
            重排
          </button>
          <label className={`text-xs ${rerank ? "text-gray-500" : "text-gray-300"}`}>
            阈值：建议[0.06, 0.7419]
            <input
              type="number"
              step="0.01"
              value={minScore}
              disabled={!rerank}
              placeholder="不过滤"
              onChange={(event) => setMinScore(event.target.value)}
              className="mt-1 block w-24 h-9 px-2 rounded-lg border border-gray-200 text-sm text-gray-900 disabled:bg-gray-50"
            />
          </label>
          <label className="text-xs text-gray-500">
            top-k
            <input
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(event) =>
                setTopK(Math.min(20, Math.max(1, Number(event.target.value) || 1)))
              }
              className="mt-1 block w-20 h-9 px-2 rounded-lg border border-gray-200 text-sm text-gray-900"
            />
          </label>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!searchQuery.trim() || searching}
            className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:bg-gray-200 disabled:text-gray-400"
          >
            {searching ? "检索中…" : "检索"}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-4">
        {matchedCode && (
          <p className="mb-3 shrink-0 text-xs text-gray-500">已按股票代码 {matchedCode} 限定范围</p>
        )}
        {hits && resultMode !== "vector" && keywordQuery !== searchedQuery && (
          <p className="mb-3 shrink-0 text-xs text-gray-500">
            {keywordQuery
              ? `关键词按「${keywordQuery}」检索，已去掉作为过滤条件的股票代码`
              : "去掉作为过滤条件的股票代码后，没有剩下可检索的词"}
          </p>
        )}
        {resultRerank && hits?.some((hit) => hit.dropped) && (
          <p className="mb-3 shrink-0 text-xs text-gray-500">变灰的行低于阈值，不会交给模型。</p>
        )}
        {hits && hits.length === 0 && <p className="text-sm text-gray-400">没有找到相关片段</p>}
        {hits && hits.length > 0 && (
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white [&_th]:border-b [&_th]:border-gray-200">
                <tr className="text-left text-xs text-gray-500">
                  {resultMode === "vector" && (
                    <th className="py-2 pr-2 font-medium whitespace-nowrap">
                      {resultRerank ? "向量名次" : "名次"}
                    </th>
                  )}
                  {resultMode === "vector" && <th className="py-2 pr-2 font-medium">余弦分</th>}
                  {resultMode === "keyword" && (
                    <th className="py-2 pr-2 font-medium whitespace-nowrap">
                      {resultRerank ? "关键词名次" : "名次"}
                    </th>
                  )}
                  {resultMode === "keyword" && <th className="py-2 pr-2 font-medium">全文分</th>}
                  {resultMode === "hybrid" && (
                    <>
                      <th className="py-2 pr-2 font-medium whitespace-nowrap">向量名次</th>
                      <th className="py-2 pr-2 font-medium whitespace-nowrap">余弦分</th>
                      <th className="py-2 pr-2 font-medium whitespace-nowrap">关键词名次</th>
                      <th className="py-2 pr-2 font-medium whitespace-nowrap">全文分</th>
                      <th className="py-2 pr-2 font-medium whitespace-nowrap">融合名次</th>
                      <th className="py-2 pr-2 font-medium whitespace-nowrap">融合分</th>
                    </>
                  )}
                  {resultRerank && (
                    <>
                      <th className="py-2 pr-2 font-medium whitespace-nowrap">重排名次</th>
                      <th className="py-2 pr-2 font-medium whitespace-nowrap">重排分</th>
                    </>
                  )}
                  <th className="py-2 pr-2 font-medium">标题</th>
                  <th className="py-2 pr-2 font-medium whitespace-nowrap">页码</th>
                  <th className="py-2 font-medium">正文</th>
                </tr>
              </thead>
              <tbody>
                {hits.map((hit) => (
                  <tr
                    key={hit.id}
                    className={`align-top [&_td]:border-b [&_td]:border-gray-100 ${hit.dropped ? "text-gray-400" : ""}`}
                  >
                    {resultMode === "vector" && (
                      <td className="py-3 pr-2 text-gray-500">{rankText(hit.vectorRank)}</td>
                    )}
                    {resultMode === "vector" && (
                      <td className="py-3 pr-2 tabular-nums">{scoreText(hit.vectorScore)}</td>
                    )}
                    {resultMode === "keyword" && (
                      <td className="py-3 pr-2 text-gray-500">{rankText(hit.keywordRank)}</td>
                    )}
                    {resultMode === "keyword" && (
                      <td className="py-3 pr-2 tabular-nums">{scoreText(hit.keywordScore)}</td>
                    )}
                    {resultMode === "hybrid" && (
                      <>
                        <td className="py-3 pr-2 text-gray-500">{rankText(hit.vectorRank)}</td>
                        <td className="py-3 pr-2 tabular-nums">{scoreText(hit.vectorScore)}</td>
                        <td className="py-3 pr-2 text-gray-500">{rankText(hit.keywordRank)}</td>
                        <td className="py-3 pr-2 tabular-nums">{scoreText(hit.keywordScore)}</td>
                        <td className="py-3 pr-2 text-gray-500">
                          {rankText(hit.rrfRank ?? hit.rank)}
                        </td>
                        <td className="py-3 pr-2 tabular-nums">
                          {scoreText(hit.rrfScore ?? hit.score, 4)}
                        </td>
                      </>
                    )}
                    {resultRerank && (
                      <>
                        <td className="py-3 pr-2 text-gray-500">{rankText(hit.rerankRank)}</td>
                        <td className="py-3 pr-2 tabular-nums">{scoreText(hit.rerankScore, 4)}</td>
                      </>
                    )}
                    <td className="py-3 pr-2 min-w-24">{hit.title}</td>
                    <td className="py-3 pr-2 whitespace-nowrap text-gray-500">{pageLabel(hit)}</td>
                    <td className="py-3 whitespace-pre-wrap leading-relaxed">{hit.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RagSearch;
