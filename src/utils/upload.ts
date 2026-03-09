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
