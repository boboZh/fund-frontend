import SparkMD5 from "spark-md5";

export const calculateHash = async (chunks: Blob[]): Promise<string> => {
  return new Promise((resolve) => {
    const spark = new SparkMD5.ArrayBuffer();
    let count = 0;
    const reader = new FileReader();

    reader.onload = (e) => {
      //  逐个读取切片，增量计算
      spark.append(e.target?.result as ArrayBuffer);
      count++;
      if (count === chunks.length) {
        resolve(spark.end());
      } else {
        reader.readAsArrayBuffer(chunks[count]);
      }
    };

    reader.readAsArrayBuffer(chunks[0]);
  });
};

export const calculateHashWithWorker = (chunks) => {
  return new Promise((resolve, reject) => {
    // 2G文件，用spark-md5计算内存占用260M左右，用wasm占用200M左右，为什么占用这么多M内存
    const worker = new Worker(new URL("../workers/hashWasm.worker.js", import.meta.url), {
      type: "module",
    });

    // 把chunks传给worker时，浏览器底层做了一次数据的深拷贝，内存物理隔离，不会影响主线程的运行
    worker.postMessage({ chunks });

    worker.onmessage = (e) => {
      const { type, percentage, hash } = e.data;
      if (type === "progress") {
        console.log(`当前哈希计算进度：${percentage}%`);
      } else if (type === "success") {
        console.log(`完成计算，最终hash为：${hash}`);
        // 手动杀掉Worker进程，释放内存
        worker.terminate();
        resolve(hash);
      }
    };

    worker.onerror = (err) => {
      console.error("worker 计算hash时出错", err);
      worker.terminate();
      reject(err);
    };
  });
};

/**
 * 极速抽样哈希 (B站/网盘同款策略)
 * 甚至都不需要放进 Web Worker 里，因为它太快了，连主线程都感觉不到它在跑！
 * @param {File} file - 用户选择的 File 对象
 * @returns {Promise<string>} - 返回计算极速 Hash
 */
export const calculateSampleHash = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    (async () => {
      // 定义每个采样块的大小，比如 2MB
      const SAMPLE_SIZE = 2 * 1024 * 1024;
      const chunks: Blob[] = [];

      // 1. 如果文件小于 20MB，直接全量算，不搞花里胡哨的
      if (file.size <= 20 * 1024 * 1024) {
        chunks.push(file.slice(0, file.size));
      } else {
        // 2. 核心抽样逻辑 (针对超大文件)

        // 头部：提取开头的 2MB
        chunks.push(file.slice(0, SAMPLE_SIZE));

        // 中部 1：提取 1/3 位置的 2MB
        const mid1 = Math.floor(file.size / 3);
        chunks.push(file.slice(mid1, mid1 + SAMPLE_SIZE));

        // 中部 2：提取 2/3 位置的 2MB
        const mid2 = Math.floor((file.size / 3) * 2);
        chunks.push(file.slice(mid2, mid2 + SAMPLE_SIZE));

        // 尾部：提取倒数 2MB
        chunks.push(file.slice(file.size - SAMPLE_SIZE, file.size));
      }

      try {
        const spark = new SparkMD5.ArrayBuffer();

        // 🌟 关键防碰撞动作：把文件的 size 和修改时间作为前缀“盐”加进去
        // 这样就算有两个文件抽样部分恰好一样，只要体积不同，Hash 也绝对不同！
        const metaData = `${file.name}-${file.size}-${file.lastModified}`;
        spark.append(new TextEncoder().encode(metaData));

        // 3. 顺序读取这几个极小的切片并计算
        for (const chunk of chunks) {
          // 这里的 I/O 读取量从 2000MB 变成了区区 8MB，瞬间完成！
          const buffer = await chunk.arrayBuffer();
          spark.append(buffer);
        }

        // 输出最终的极速 Hash
        resolve(spark.end());
      } catch (error) {
        reject(error);
      }
    })();
  });
};
