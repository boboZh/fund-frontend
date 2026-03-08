import React, { useState, useRef, useEffect } from "react";

const AudioDemo: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 记录下一段音频的绝对播放时间！(用来消除缝隙和咔哒声)
  const nextPlayTimeRef = useRef<number>(0);

  const connectWS = () => {
    // 1. 初始化浏览器的声卡环境 (AudioContext 必须在用户点击按钮后才能创建，浏览器安全限制)
    if (!audioCtxRef.current) {
      const AudioContextClass: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
      audioCtxRef.current = new AudioContextClass({ sampleRate: 16000 });
    }

    // 2. 连接后端 WebSocket
    const host =
      process.env.NODE_ENV === "development" ? "ws://127.0.0.1:3000" : "ws://112.126.27.148";
    const ws = new WebSocket(`${host}/api/audio-stream`); // 改成你后端的真实地址
    ws.binaryType = "arraybuffer"; // 声明接收的是二进制原裸流

    ws.onopen = () => {
      console.log("✅ WebSocket 连接成功");
      setIsConnected(true);

      // 防网络抖动：不要立刻播首帧，故意往后延迟 200 毫秒！
      // 这 200 毫秒就是我们的 Jitter Buffer 吸收区
      nextPlayTimeRef.current = audioCtxRef.current!.currentTime + 0.2;
    };

    ws.onmessage = async (event) => {
      if (event.data instanceof ArrayBuffer) {
        const audioCtx = audioCtxRef.current!;

        // 后端发来的是 16bit 的 Int16Array PCM，
        // Web Audio API 的底噪要求 Float32Array (-1.0 到 1.0 之间)，需要手动转码
        const int16Data = new Int16Array(event.data);
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
          float32Data[i] = int16Data[i] / 32768.0; // 归一化
        }

        // 将 Float32 丢进音频缓冲区
        const audioBuffer = audioCtx.createBuffer(1, float32Data.length, 16000);
        audioBuffer.getChannelData(0).set(float32Data);

        // 创建播放源并连接到物理喇叭
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);

        // 如果网络极度卡顿，导致下一段本该播放的时间早已经过去了
        // 必须立刻重置游标到当前时间，否则音频会堆积导致快进播放
        const currentTime = audioCtx.currentTime;
        if (nextPlayTimeRef.current < currentTime) {
          console.warn("⚠️ 发生网络延迟，重置播放游标");
          nextPlayTimeRef.current = currentTime + 0.1;
        }

        // 定时精确播放！不是用 setTimeout，而是用声卡底层的绝对时间轴！
        source.start(nextPlayTimeRef.current);

        // 播放游标向前推移这段音频的长度，等待下一个分片
        nextPlayTimeRef.current += audioBuffer.duration;
      }
    };

    ws.onclose = () => setIsConnected(false);
    wsRef.current = ws;
  };

  const disconnectWS = () => {
    wsRef.current?.close();
  };

  // 组件销毁时断开
  useEffect(() => {
    return () => disconnectWS();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-gray-50">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🎧</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">端到端音频流调度 (Zoom 测试)</h2>
        <p className="text-sm text-gray-500 mb-8">
          基于原生 WebSocket 与 Web Audio API，手动接管 PCM 解码与 Jitter Buffer 无缝拼接。
        </p>

        {isConnected ? (
          <div>
            <div className="flex justify-center items-center gap-2 mb-8">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-600 font-medium text-sm">正在接收并播放音频流...</span>
            </div>
            <button
              onClick={disconnectWS}
              className="px-8 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-200"
            >
              断开连接
            </button>
          </div>
        ) : (
          <button
            onClick={connectWS}
            className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
          >
            开始接收音频流
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioDemo;
