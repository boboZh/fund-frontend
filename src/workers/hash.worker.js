import SparkMD5 from "spark-md5";

self.onmessage = async (e) => {
  const { chunks } = e.data;

  const spark = new SparkMD5.ArrayBuffer();

  let percentage = 0;
  const totalChunks = chunks.length;

  for (let i = 0; i < totalChunks; i++) {
    const chunkBlob = chunks[i];
    const buffer = await chunkBlob.arrayBuffer();

    spark.append(buffer);
    percentage = Number(((i + 1) / totalChunks) * 100).toFixed(2);
    self.postMessage({
      type: "progress",
      percentage,
    });
  }

  const finalHash = spark.end();

  self.postMessage({ type: "success", hash: finalHash });
};
