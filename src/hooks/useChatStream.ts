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
  const handleSend = async () => {
    if (!pathSessionId) return;
    if (!input.trim()) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    const _sessionId = pathSessionId;

    const userMsg = input;
    setInput("");
    //
    setMessages((prev) => [...prev, { role: "user", content: userMsg, id: uuidv4() }]);
    setMessages((prev) => [...prev, { role: "ai", content: "", id: uuidv4() }]);

    // 更新消息的步骤条及状态
    const updateSteps = (taskId: string, status: AiTaskStatus, text: string) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role !== "ai") return prev;

        const newSteps = [...(lastMsg.steps || [])];

        const curStep = newSteps.find((item) => item.id === taskId);
        if (!curStep) {
          newSteps.push({
            id: taskId,
            status,
            text,
          });
        } else {
          curStep.text = text;
          curStep.status = status;
        }

        return [...prev.slice(0, -1), { ...lastMsg, steps: newSteps }];
      });
    };

    let buffer = "";

    try {
      const response = await myFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          sessionId: _sessionId,
          userNickname: user?.nickname || "用户",
        }),
        credentials: "include",
        signal: abortController.signal,
      });
      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const updateLastMsgContent = (content) => {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (!lastMsg) return prev;
          const updated: AiChatModel[] = [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              content: lastMsg.content + content,
            } as AiChatModel,
          ];
          return updated;
        });
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        console.log("chunk: ", chunk);

        buffer += chunk; // 粘合剂缓冲区

        buffer = streamParser(buffer, updateLastMsgContent, updateSteps);
      }
      if (buffer) {
        updateLastMsgContent(buffer);
        buffer = "";
      }

      afterChatFinished(_sessionId);
    } catch (err) {
      console.log("aichat err: ", err);
      let status: AiTaskStatus = "error";
      if (err instanceof Error && err.name === "AbortError") {
        console.log("用户终止了请求");
        status = "abort"; // 主动终止请求，不走error流程
      } else {
        toast.error(err instanceof Error ? err.message : "请求失败，请稍后再试");
      }
      setMessages((prev) => {
        if (!prev || prev.length === 0) return [];
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role !== "ai") return prev;
        const newSteps = lastMsg.steps || [];
        if (newSteps.length > 0) {
          newSteps[newSteps.length - 1].status = status;
        }
        return [
          ...prev.slice(0, -1),
          {
            ...lastMsg,
            steps: newSteps,
          },
        ];
      });
    } finally {
      setIsLoading(false);
      // 清除实例
      abortControllerRef.current = null;
      setMessages((prev) => {
        if (!prev || prev.length === 0) return [];
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role !== "ai") return prev;
        const newSteps = lastMsg.steps || [];
        if (newSteps.length > 0) {
          newSteps[newSteps.length - 1].status = "success";
        }
        return [
          ...prev.slice(0, -1),
          {
            ...lastMsg,
            steps: newSteps,
            currentTaskText: "",
            currentTaskType: "",
          },
        ];
      });
    }
  };

  // 主动终止会话
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
  };
};

export default useChatStream;
