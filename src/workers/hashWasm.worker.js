import { createMD5 } from "hash-wasm";

self.onmessage = async (e) => {
  const { chunks } = e.data;
  try {
    const hasher = await createMD5();
    hasher.init();

    const totalChunks = chunks.length;
    let percentage = 0;
    for (let i = 0; i < totalChunks; i++) {
      const chunkBlob = chunks[i];
      // 硬盘读取的物理极限（I/O 瓶颈）：将硬盘（Disk）数据加载到浏览器堆内存（RAM）的这个 I/O 阶段。对于 2GB 的文件，如果用户的设备是机械硬盘，光是纯物理读取就需要十几秒。
      const buffer = await chunkBlob.arrayBuffer();
      // 套上 Uint8Array 视图，这是 Wasm 唯一能无损接收的数据格式
      const view = new Uint8Array(buffer);
      hasher.update(view);

      percentage = Number(((i + 1) / totalChunks) * 100).toFixed(2);
      self.postMessage({
        type: "progress",
        percentage,
      });
    }

    const finalHash = hasher.digest("hex");

    self.postMessage({ type: "success", hash: finalHash });
  } catch (error) {
    self.postMessage({ type: "error", message: error.message });
  }
};
