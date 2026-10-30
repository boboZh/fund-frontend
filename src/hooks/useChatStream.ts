import { useState, useRef, useCallback, useEffect } from "react";
import type { AiChatModel, AiTaskStatus, ResearchCitation } from "@/types/ai";
import { flushStreamTail, streamParser } from "@/utils/streamParser";
import { myFetch } from "@/utils/myFetch";
import useStore from "@/store";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { replayChatResponse } from "@/utils/replayChat";

type StepUpdate = { taskId: string; status: AiTaskStatus; text: string };

type PendingStreamWrite = {
  id: string | null;
  content: string;
  stepUpdates: StepUpdate[];
  sources: ResearchCitation[] | null;
  status: NonNullable<AiChatModel["status"]> | null;
};

const debug = import.meta.env.VITE_CHAT_IMMEDIATE === "true";
console.log("debugL: ", debug);
const emptyPending = (): PendingStreamWrite => ({
  id: null,
  content: "",
  stepUpdates: [],
  sources: null,
  status: null,
});

const hasPendingWork = (pending: PendingStreamWrite) =>
  Boolean(pending.content || pending.stepUpdates.length || pending.sources || pending.status);

/**
 * 把同一帧内积压的正文增量、步骤、来源、终态一次性写进对应 id 的最后一条消息。
 * 必须按 id 对齐：切会话或新开一轮后，迟到的 rAF 不能改到别的气泡。
 */

const applyPending = (prev: AiChatModel[], pending: PendingStreamWrite): AiChatModel[] => {
  const lastMsg = prev[prev.length - 1];
  if (!pending.id || lastMsg?.id !== pending.id) return prev;

  let steps = lastMsg.steps;
  if (pending.stepUpdates.length > 0) {
    steps = [...(lastMsg.steps || [])];
    for (const update of pending.stepUpdates) {
      const idx = steps.findIndex((item) => item.id === update.taskId);
      if (idx === -1) {
        steps.push({ id: update.taskId, status: update.status, text: update.text });
      } else {
        steps[idx] = { ...steps[idx], status: update.status, text: update.text };
      }
    }
  }

  if (pending.status && steps && steps.length > 0) {
    const nextSteps = [...steps];
    nextSteps[nextSteps.length - 1] = {
      ...nextSteps[nextSteps.length - 1],
      status: pending.status,
    };
    steps = nextSteps;
  }

  return [
    ...prev.slice(0, -1),
    {
      ...lastMsg,
      content: lastMsg.content + pending.content,
      ...(steps ? { steps } : {}),
      ...(pending.sources ? { sources: pending.sources } : {}),
      ...(pending.status ? { status: pending.status } : {}),
    },
  ];
};

const useChatStream = (
  pathSessionId: string | undefined,
  afterChatFinished: (activeSessionId: string) => void,
) => {
  const [input, setInput] = useState("");
  const { user } = useStore();
  const [messages, setMessages] = useState<AiChatModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingRef = useRef<PendingStreamWrite>(emptyPending());
  const rafIdRef = useRef<number | null>(null);

  const flushPending = useCallback(() => {
    rafIdRef.current = null;
    const pending = pendingRef.current;
    if (!pending.id || !hasPendingWork(pending)) return;
    pendingRef.current = { ...emptyPending(), id: pending.id };
    setMessages((prev) => applyPending(prev, pending));
  }, []);

  const flushPendingNow = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    flushPending();
  }, [flushPending]);

  // 同一帧内多次 read() 只提交一次。正文 / steps / sources 必须进同一条队列，
  // 否则步骤条立刻 setState 时读到的 content 不含尚未 flush 的 token。
  const scheduleFlush = useCallback(() => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(flushPending);
  }, [flushPending]);

  const cancelPending = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingRef.current = emptyPending();
  }, []);

  const chat = async (userMsg: string, isRegenerate = false) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    cancelPending();
    const aiMsgId = uuidv4();
    pendingRef.current = { ...emptyPending(), id: aiMsgId };

    setIsLoading(true);
    const _sessionId = pathSessionId;

    setMessages((prev) => {
      const newMsgs = [...prev];
      if (isRegenerate) {
        if (newMsgs[newMsgs.length - 1]?.role === "ai") {
          newMsgs.pop();
        }
      } else {
        newMsgs.push({ role: "user", content: userMsg, id: uuidv4() });
      }

      newMsgs.push({ role: "ai", content: "", id: aiMsgId });
      return newMsgs;
    });

    const updateLastMsgContentImmediate = (content: string) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (!lastMsg) return prev;
        return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + content }];
      });
    };

    const setSourcesImmediate = (sources: ResearchCitation[]) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (!lastMsg || lastMsg.role !== "ai") return prev;
        return [...prev.slice(0, -1), { ...lastMsg, sources }];
      });
    };

    const updateStepsImmediate = (taskId: string, status: AiTaskStatus, text: string) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role !== "ai") return prev;

        const newSteps = [...(lastMsg.steps || [])];
        const curStep = newSteps.find((item) => item.id === taskId);

        if (!curStep) {
          newSteps.push({ id: taskId, status, text });
        } else {
          curStep.text = text;
          curStep.status = status;
        }

        return [...prev.slice(0, -1), { ...lastMsg, steps: newSteps }];
      });
    };

    const updateLastMsgContent = (content: string) => {
      if (!content) return;
      if (debug) return updateLastMsgContentImmediate(content);
      pendingRef.current.content += content;
      scheduleFlush();
    };

    const updateSteps = (taskId: string, status: AiTaskStatus, text: string) => {
      if (debug) return updateStepsImmediate(taskId, status, text);
      pendingRef.current.stepUpdates.push({ taskId, status, text });
      scheduleFlush();
    };

    const setSources = (sources: ResearchCitation[]) => {
      if (debug) return setSourcesImmediate(sources);
      pendingRef.current.sources = sources;
      scheduleFlush();
    };

    let buffer = "";

    try {
      // const response = await myFetch("/api/ai/chat", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     message: userMsg,
      //     sessionId: _sessionId,
      //     isRegenerate,
      //     userNickname: user?.nickname || "用户",
      //   }),
      //   credentials: "include",
      //   signal: abortController.signal,
      // });

      const response = replayChatResponse();

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      // const recorded: { t: number; text: string }[] = [];
      // const t0 = performance.now();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // recorded.push({ t: performance.now() - t0, text: chunk });
        buffer += chunk;

        buffer = streamParser(buffer, updateLastMsgContent, updateSteps, setSources);
      }

      // console.log("recorded: ", JSON.stringify(recorded));

      // 半截 [CITATIONS] 或 [S: 留在肚子里时不能写进正文，否则来源 JSON 会露在气泡末尾。
      flushStreamTail(buffer, updateLastMsgContent);
      buffer = "";

      pendingRef.current.status = "success";
      flushPendingNow();

      afterChatFinished(_sessionId || "");
    } catch (err) {
      console.log("aichat err: ", err);
      let status: NonNullable<AiChatModel["status"]> = "error";

      if (err instanceof Error && err.name === "AbortError") {
        console.log("用户主动终止了请求");
        status = "abort";
      } else {
        toast.error(err instanceof Error ? err.message : "请求失败，请稍后再试");
      }

      pendingRef.current.status = status;
      flushPendingNow();
    } finally {
      // isLoading 期间发送入口被禁用，同一时刻只会有一轮 chat，这里可以直接收尾。
      cancelPending();
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = async () => {
    if (!pathSessionId) return;
    const lastUserMsg = messages
      .slice()
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMsg) return;

    chat(lastUserMsg.content, true);
  };

  const handleSend = () => {
    if (!pathSessionId) return;
    if (!input.trim()) return;

    chat(input, false);
    setInput("");
  };

  const stopChat = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    return () => {
      cancelPending();
      abortControllerRef.current?.abort();
    };
  }, [pathSessionId, cancelPending]);

  return {
    input,
    messages,
    setInput,
    setMessages,
    handleSend,
    stopChat,
    isLoading,
    handleRegenerate,
  };
};

export default useChatStream;
