import React, { useState, useRef, useEffect } from "react";
import useStore from "@/store";

const ImageToVideo: React.FC = () => {
  const { initFFmpeg, isReady, isGenerating, progress, videoUrl, generateVideo } = useStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initFFmpeg();
  }, [initFFmpeg]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // 转换为数组（最好对文件名称进行排序，保证帧顺序正确）
      const files = Array.from(e.target.files).sort((a, b) => a.name.localeCompare(b.name));
      setSelectedFiles(files);
    }
  };

  const handleGenerate = () => {
    if (selectedFiles.length > 0) {
      generateVideo(selectedFiles);
    }
  };
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">AIGC图片转视频（纯前端）</h2>

      {/* 状态提示 */}
      {!isReady && (
        <div className="p-4 bg-yellow-50 text-yellow-600 rounded">
          正在加载FFmpeg核心模块，请稍后
        </div>
      )}

      {/* 文件选择 */}
      <div className="space-y-4">
        <input
          type="file"
          accept="image/jpeg, image/png"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={!isReady || isGenerating}
        />
        {selectedFiles.length > 0 && (
          <p className="text-sm text-gray-600">已选择{selectedFiles.length}张图片</p>
        )}
        {/* 生成按钮 */}
        <div className="space-y-2">
          <button
            onClick={handleGenerate}
            disabled={!isReady || isGenerating || selectedFiles.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? "正在生成..." : "开始合成视频"}
          </button>
          {isGenerating && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
              <p className="text-sm text-gray-600 mt-1">进度：{progress}%</p>
            </div>
          )}
        </div>
        {/* 视频预览 */}
        {videoUrl && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-2">生成结果：</h3>
            <video src={videoUrl} controls className="w-full rounded shadow-lg border" />
            <a
              href={videoUrl}
              download="aigc-output.mp4"
              className="inline-block mt-4 px-4 bg-green-600 text-white rounded hover:bg-green-700"
            >
              下载视频
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageToVideo;
