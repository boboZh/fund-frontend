import { createMD5 } from "hash-wasm";

self.onmessage = async (e) => {
  const { chunks } = e.data;
  try {
    const hasher = await createMD5();
    hasher.init();

    const totalChunks = chunks.length;
    let percentage = 0;
    // 串行写法：死等硬盘把数据读出来(I/O)阻塞，数据拿到手扔给cpu狂算，与此同时硬盘没干活
    // for (let i = 0; i < totalChunks; i++) {
    //   const chunkBlob = chunks[i];
    //   // 硬盘读取的物理极限（I/O 瓶颈）：将硬盘（Disk）数据加载到浏览器堆内存（RAM）的这个 I/O 阶段。对于 2GB 的文件，如果用户的设备是机械硬盘，光是纯物理读取就需要十几秒。
    //   const buffer = await chunkBlob.arrayBuffer();
    //   // 套上 Uint8Array 视图，这是 Wasm 唯一能无损接收的数据格式
    //   const view = new Uint8Array(buffer);
    //   hasher.update(view);

    //   percentage = Number(((i + 1) / totalChunks) * 100).toFixed(2);
    //   self.postMessage({
    //     type: "progress",
    //     percentage,
    //   });
    // }

    // 流水线：提前把第一个切片的I/O读取任务发出去，针对2G的文件，速度提升1秒，从16秒提升到15秒
    let nextBufferPromise = chunks[0].arrayBuffer();
    for (let i = 0; i < chunks.length; i++) {
      // 等待当前切片的数据从硬盘读到内存
      const currentBuffer = await nextBufferPromise;
      // 让cpu干活之前，把下一个切片的读取指令发给操作系统
      // 此时硬盘默默读取下一个切片的数据，cpu正在计算当前切片的hash
      if (i + 1 < chunks.length) {
        nextBufferPromise = chunks[i + 1].arrayBuffer();
      }
      const view = new Uint8Array(currentBuffer);
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
