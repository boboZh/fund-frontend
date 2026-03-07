import React, { useRef } from "react";
import axios from "axios";
import SparkMD5 from "spark-md5";
import useStore from "@/store";
import { AsyncQueue } from "@/utils/AsyncQueue";
import { apiMergeFile, apiUpload, apiVerifyFileStatus } from "@/apis/upload.api";
import { toast } from "sonner";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5M一个切片
const MAX_CONCURRENCY = 3; // 最多同时传3个切片

const ChunkUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { progress, status, setProgress, setStatus } = useStore();

  const calculateHash = async (chunks: Blob[]): Promise<string> => {
    setStatus("calculating");

    return new Promise((resolve) => {
      const spark = new SparkMD5.ArrayBuffer();
      let count = 0;
      const reader = new FileReader();

      reader.onload = (e) => {
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

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    // 切片
    const chunks: { chunk: Blob; hash: string; index: number }[] = [];
    let cur = 0;
    while (cur < file.size) {
      chunks.push({
        chunk: file.slice(cur, cur + CHUNK_SIZE),
        hash: "",
        index: chunks.length,
      });
      cur += CHUNK_SIZE;
    }

    //   算hash
    const fileHash = await calculateHash(chunks.map((c) => c.chunk));
    setStatus("loading");

    const { data: verifyData } = await apiVerifyFileStatus({
      fileHash,
      fileName: file.name,
    });

    if (!verifyData.shouldUpload) {
      setStatus("success");
      setProgress(100);
      toast.success("秒传成功");
      return;
    }

    const uploadedChunks: string[] = verifyData.uploadedChunks;
    const missingChunks = chunks.filter(
      (item) => !uploadedChunks.includes(`${fileHash}-${item.index}`),
    );

    let uploadedCount = chunks.length - missingChunks.length;
    setProgress(Math.floor((uploadedCount / chunks.length) * 100));

    const queue = new AsyncQueue(MAX_CONCURRENCY);
    const uploadPromises = missingChunks.map((item) => {
      return queue.add(async () => {
        const formData = new FormData();
        formData.append("chunk", item.chunk);
        formData.append("fileHash", fileHash);
        formData.append("chunkHash", `${fileHash}-${item.index}`);

        await apiUpload(formData);
        uploadedCount++;
        setProgress(Math.floor((uploadedCount / chunks.length) * 100));
      });
    });
    await Promise.all(uploadPromises);

    //   发送完了合并
    setStatus("merging");
    await apiMergeFile({
      fileHash,
      fileName: file.name,
      size: file.size,
    });
    setStatus("success");
    toast.success("上传、合并成功");
  };

  return (
    <div className="p-4 border rounded">
      <input type="file" ref={fileInputRef} className="mb-4 cursor-pointer" />
      <button
        onClick={handleUpload}
        disabled={status !== "idle" && status !== "error"}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {status === "idle" ? "开始上传" : status}
      </button>
      {/**进度条展示 */}
      <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        当前状态：{status} | 进度：{progress}%
      </p>
    </div>
  );
};

export default ChunkUpload;
