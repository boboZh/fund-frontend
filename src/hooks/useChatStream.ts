import { useState, useRef, useCallback } from "react";
import type { AiChatModel, AiTaskStatus } from "@/types/ai";
import { streamParser } from "@/utils/streamParser";
import { myFetch } from "@/utils/myFetch";
import useStore from "@/store";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const useChatStream = (
  pathSessionId: string | undefined,
  afterChatFinished: (activeSessionId: string) => void,
) => {
  const [input, setInput] = useState("");
  const { user } = useStore();
  const [messages, setMessages] = useState<AiChatModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 处理聊天逻辑
  const chat = async (userMsg: string, isRegenerate = false) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    const _sessionId = pathSessionId;

    // 🌟 修复 1：统一收拢消息数组的构建逻辑
    setMessages((prev) => {
      const newMsgs = [...prev];
      if (isRegenerate) {
        // 如果是重新生成，弹出最后那条失败的 AI 消息
        if (newMsgs[newMsgs.length - 1]?.role === "ai") {
          newMsgs.pop();
        }
        // 注意：这里不用再 push user 消息了，因为上一条本来就是 user！
      } else {
        // 正常提问，先 push 用户的消息
        newMsgs.push({ role: "user", content: userMsg, id: uuidv4() });
      }

      // 无论如何，最后必定跟上一个全新的空 AI 消息气泡
      newMsgs.push({ role: "ai", content: "", id: uuidv4() });
      return newMsgs;
    });

    // 更新消息的步骤条及状态
    const updateSteps = (taskId: string, status: AiTaskStatus, text: string) => {
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

    let buffer = "";

    try {
      // http://localhost:3000
      const response = await myFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          sessionId: _sessionId,
          isRegenerate,
          userNickname: user?.nickname || "用户",
        }),
        credentials: "include",
        signal: abortController.signal,
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      const updateLastMsgContent = (content: string) => {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (!lastMsg) return prev;
          return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + content }];
        });
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        buffer = streamParser(buffer, updateLastMsgContent, updateSteps);
      }

      // 如果流结束了肚子里还有残留，强制吐出
      if (buffer) {
        updateLastMsgContent(buffer);
        buffer = "";
      }

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role !== "ai") return prev;
        const newSteps = lastMsg.steps || [];
        if (newSteps.length > 0) {
          newSteps[newSteps.length - 1].status = "success";
        }
        return [...prev.slice(0, -1), { ...lastMsg, status: "success", steps: newSteps }];
      });

      afterChatFinished(_sessionId || "");
    } catch (err) {
      console.log("aichat err: ", err);
      let status: AiTaskStatus = "error";

      if (err instanceof Error && err.name === "AbortError") {
        console.log("用户主动终止了请求");
        status = "abort";
      } else {
        toast.error(err instanceof Error ? err.message : "请求失败，请稍后再试");
      }

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role !== "ai") return prev;

        const newSteps = lastMsg.steps || [];
        if (newSteps.length > 0) {
          newSteps[newSteps.length - 1].status = status; // 这里 status 是 error 或 abort
        }

        return [...prev.slice(0, -1), { ...lastMsg, status, steps: newSteps }];
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 重新生成
  const handleRegenerate = async () => {
    if (!pathSessionId) return;
    // 找到上一条用户发的消息
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

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
