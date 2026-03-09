import { type StateCreator } from "zustand";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { toast } from "sonner";
import { normalizeImage } from "@/utils/tools";

export interface VideoSlice {
  ffmpeg: FFmpeg | null;
  isReady: boolean;
  isGenerating: boolean;
  progress: number;
  videoUrl: string | null;
  initFFmpeg: () => Promise<void>;
  generateVideo: (files: File[]) => Promise<void>;
}

const createVideoModule: StateCreator<VideoSlice> = (set, get) => ({
  ffmpeg: null,
  isReady: false,
  isGenerating: false,
  progress: 0,
  videoUrl: null,

  initFFmpeg: async () => {
    if (get().isReady) return;

    const ffmpeg = new FFmpeg();

    // 监听FFmpeg内部日志，打印任何报错
    ffmpeg.on("log", ({ message }) => {
      console.log("[ffmpeg log]: ", message);
    });

    // 监听进度
    ffmpeg.on("progress", ({ progress }) => {
      set({ progress: Math.round(progress * 100) });
    });

    // 加载 FFmpeg 核心文件 (这里使用 unpkg CDN，你也可以将这些文件下载放到项目的 public 目录下以提升国内加载速度)
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    set({ ffmpeg, isReady: true });
  },

  generateVideo: async (files: File[]) => {
    const { ffmpeg, isReady } = get();
    if (!ffmpeg || !isReady || files.length === 0) return;

    set({ isGenerating: true, progress: 0, videoUrl: null });

    try {
      // 将文件写入 FFmpeg 虚拟文件系统
      // 命名规范：image1.jpg, image2.jpg... 方便 ffmpeg 序列读取
      for (let i = 0; i < files.length; i++) {
        const fileData = await normalizeImage(files[i]);
        await ffmpeg.writeFile(`image${i + 1}.jpg`, fileData);
      }

      // 执行转换命令
      // -framerate 1: 每秒1张图片 (可以根据需求调整)
      // -i image%d.jpg: 读取 image1.jpg, image2.jpg 这样的序列文件
      // -c:v libx264: 视频编码器
      // -r 30: 输出视频帧率 30fps
      // -pix_fmt yuv420p: 像素格式，保证跨平台兼容性
      await ffmpeg.exec([
        "-framerate",
        "1", // 这里的 1 代表每张图片停留 1 秒
        "-i",
        "image%d.jpg",
        "-c:v",
        "libx264",
        "-r",
        "30",
        "-pix_fmt",
        "yuv420p",
        "output.mp4",
      ]);

      // 读取生成的视频文件
      const data = await ffmpeg.readFile("output.mp4");
      // 检查生成的文件是否为空！
      if (data.byteLength === 0) {
        throw new Error("生成的视频大小为 0 字节，请检查控制台 [FFmpeg Log] 的报错信息！");
      }
      // 将其转换为 Blob URL 供页面播放或下载
      const videoBlob = new Blob([data], { type: "video/mp4" });
      const videoUrl = URL.createObjectURL(videoBlob);

      set({ videoUrl });
    } catch (error) {
      toast.error("视频生成失败");
      console.error("视频生成失败:", error);
    } finally {
      // 清理内存中的图片和视频文件，防止爆内存
      try {
        for (let i = 0; i < files.length; i++) {
          await ffmpeg.deleteFile(`image${i + 1}.jpg`);
        }
        await ffmpeg.deleteFile("output.mp4");
      } catch (e) {
        // 忽略清理时的报错
        console.log("清理时报错：", e);
      }
      set({ isGenerating: false });
    }
  },
});

export default createVideoModule;
