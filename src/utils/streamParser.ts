import type { AiTaskStatus, ResearchCitation } from "@/types/ai";

const STEP_START = "[S:";
const CITE_START = "[CITATIONS]";
const CITE_END = "[/CITATIONS]";

// 流可能在标签中间断开。尾部只要还可能是 [S: 或 [CITATIONS] 的前缀，就先留着，避免把半个标签写进正文。
const holdIndex = (buffer: string) => {
  const max = Math.max(STEP_START.length, CITE_START.length) - 1;
  for (let len = Math.min(max, buffer.length); len > 0; len -= 1) {
    const tail = buffer.slice(buffer.length - len);
    if (STEP_START.startsWith(tail) || CITE_START.startsWith(tail)) {
      return buffer.length - len;
    }
  }
  return buffer.length;
};

const attachSources = (
  raw: string,
  setSources: (sources: ResearchCitation[]) => void,
) => {
  try {
    const parsed = JSON.parse(raw) as { sources?: ResearchCitation[] };
    if (Array.isArray(parsed.sources)) setSources(parsed.sources);
  } catch {
    // 尾标损坏时丢掉，不要把 JSON 拼进气泡。
  }
};

/**
 * 入参是尚未处理的流片段，以及更新正文、步骤、来源的三个回调。
 * 出参是还不能确定的尾巴，调用方下次拼上新片段再传入。
 * 1. [S:taskId:status:文案] 交给步骤条，以第一个 ] 结束。
 * 2. [CITATIONS]{"sources":[...]}[/CITATIONS] 挂到当前消息，JSON 里的 ] 不交给步骤条，也不写入正文。
 * 3. 两种标签都没凑齐时，只吐出不可能再变成标签的前半段。
 */
export const streamParser = (
  _buffer: string,
  updateLastMsgContent: (text: string) => void,
  setStepStatus: (taskId: string, type: AiTaskStatus, text: string) => void,
  setSources: (sources: ResearchCitation[]) => void,
) => {
  let buffer = _buffer;
  while (true) {
    const stepIdx = buffer.indexOf(STEP_START);
    const citeIdx = buffer.indexOf(CITE_START);
    const citeFirst = citeIdx !== -1 && (stepIdx === -1 || citeIdx < stepIdx);

    if (citeFirst) {
      if (citeIdx > 0) updateLastMsgContent(buffer.slice(0, citeIdx));
      const from = citeIdx + CITE_START.length;
      const endIdx = buffer.indexOf(CITE_END, from);
      if (endIdx === -1) return buffer.slice(citeIdx);
      attachSources(buffer.slice(from, endIdx), setSources);
      buffer = buffer.slice(endIdx + CITE_END.length);
      continue;
    }

    if (stepIdx !== -1) {
      const endIdx = buffer.indexOf("]", stepIdx);
      if (endIdx === -1) {
        if (stepIdx > 0) updateLastMsgContent(buffer.slice(0, stepIdx));
        return buffer.slice(stepIdx);
      }
      if (stepIdx > 0) updateLastMsgContent(buffer.slice(0, stepIdx));
      const signal = buffer.slice(stepIdx + STEP_START.length, endIdx);
      const [taskId, status, ...text] = signal.split(":");
      setStepStatus(taskId, status as AiTaskStatus, text.join(":"));
      buffer = buffer.slice(endIdx + 1);
      continue;
    }

    const cut = holdIndex(buffer);
    if (cut > 0) updateLastMsgContent(buffer.slice(0, cut));
    return buffer.slice(cut);
  }
};

// 流已经结束。完整的来源标签应在 streamParser 里被拆掉。剩下的半截标签不能再写进正文。
export const flushStreamTail = (buffer: string, updateLastMsgContent: (text: string) => void) => {
  if (!buffer || buffer.startsWith(CITE_START) || buffer.startsWith(STEP_START)) return;
  updateLastMsgContent(buffer);
};
