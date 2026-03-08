import { useEffect, useRef, useCallback, useState } from "react";
import useStore from "@/store";
import type { TaskStatus } from "@/types/aiGcTask";

export interface WsMessage {
  type: "progressing" | "ping" | "pong" | "error" | "success";
  taskId?: string;
  progress?: number;
  status?: TaskStatus;
  resultUrl?: string;
  message?: string;
}

export const useWebsocket = (url: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // 重连相关
  const reconnectCount = useRef(0);
  const maxReconnect = 5;
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCallbackRef = useRef<() => void>(() => {});

  // 心跳保持相关
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PING_INTERVAL = 30000;
  const PONG_TIMEOUT = 5000;

  const { updateTask } = useStore();

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (pongTimerRef.current) clearTimeout(pongTimerRef.current);
  }, []);

  const startHeartbeat = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (pongTimerRef.current) clearTimeout(pongTimerRef.current);

    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));

        pongTimerRef.current = setTimeout(() => {
          console.error("心跳超时：未收到服务端的pong，主动断开连接");
          wsRef.current?.close(); // 手动关闭，触发重连
        }, PONG_TIMEOUT);
      }
    }, PING_INTERVAL);
  }, []);

  const connect = useCallback(() => {
    clearTimers();

    wsRef.current = new WebSocket(url);
    setWs(wsRef.current);

    wsRef.current.onopen = () => {
      console.log("--success--websocket开启成功");
      reconnectCount.current = 0;
      startHeartbeat();
      // 连上后，向后端发送当前本地还有哪些pending的taskId，重新订阅
    };

    wsRef.current.onmessage = (event: MessageEvent) => {
      try {
        const data: WsMessage = JSON.parse(event.data);
        if (data.type === "pong") {
          // 收到pong，说明服务端活着
          if (pongTimerRef.current) clearTimeout(pongTimerRef.current);
          return;
        }

        if (data.type === "progressing" && data.taskId) {
          updateTask(data.taskId, {
            progress: data.progress!,
            status: data.status!,
            resultUrl: data.resultUrl,
            taskId: data.taskId,
          });
        }
      } catch (error) {
        console.error("解析websocket 消息失败：", error);
      }
    };

    wsRef.current.onclose = () => {
      console.warn("XXXXX Websocket断开");
      clearTimers();

      reconnectCallbackRef.current();
    };

    wsRef.current.onerror = (err) => {
      console.error("!!! Websocket 错误: ", err);
      wsRef.current?.close(); // 出错直接手动关闭，交由onclose统一处理重连
    };
  }, [url, startHeartbeat, clearTimers, updateTask]);

  const reconnect = useCallback(() => {
    if (reconnectCount.current >= maxReconnect) {
      console.error("!!! 重连失败次数过多，请检查网络");
      return;
    }
    // 重连间隔：2s，4s，8s，16s， 避免服务器宕机刚恢复就被并发重连打死
    const timeout = Math.min(10000, 2000 * Math.pow(2, reconnectCount.current));

    reconnectTimerRef.current = setTimeout(() => {
      reconnectCount.current += 1;
      console.log(`正在尝试第${reconnectCount.current}次重连...`);
      connect();
    }, timeout);
  }, [connect]);

  useEffect(() => {
    reconnectCallbackRef.current = reconnect;
  }, [reconnect]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // 防止触发无效重连
        wsRef.current.close();
      }
      clearTimers();
    };
  }, [url, clearTimers, connect]);

  return ws;
};
