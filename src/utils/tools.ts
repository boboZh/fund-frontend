import { nanoid } from "nanoid";
// 股票代码正则，支持美股、港股、A股等格式
export const allStockRegex = /\b([A-Z]{1,5}(\.[A-Z]{1,2})?|(\d{5,6})(\.(HK|SH|SZ|BJ))?)\b/g;

type ValType = string | number | null | undefined;
export const textColor = (val: ValType): string => {
  const isUp = (val: ValType): number => {
    if ([null, undefined, "-", "--", 0].includes(val)) return 0;
    const _val = typeof val === "string" ? parseFloat(val) : (val as number);
    return _val > 0 ? 1 : -1;
  };
  const up = isUp(val);
  if (up > 0) return "text-red-500";
  if (up < 0) return "text-green-500";
  return "text-gray-500";
};

// 解析ai流式响应
export const parseReponseChunk = (chunk: string) => {
  const regex = /.*\[status\]([\s\S]*?)\[status\]\s*$/;
  const match = regex.exec(chunk);
  if (match) {
    const contents = match[1].trim().split("-");
    return {
      status: contents[0],
      statusText: contents[1],
      content: "",
    };
  }
  return {
    content: chunk,
    status: undefined,
    statusText: "",
  };
};

export const generateSessionId = () => nanoid(10);

// 图片标准化处理-都转为jpg
export const normalizeImage = async (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");

      // 强制宽高为偶数（向下取偶）
      const width = img.width % 2 === 0 ? img.width : img.width - 1;
      const height = img.height % 2 === 0 ? img.height : img.height - 1;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas ctx is null"));
      // 填充白色背景，防止透明png转jpg变黑
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        async (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          const buffer = await blob.arrayBuffer();
          resolve(new Uint8Array(buffer));
        },
        "image/jpeg",
        0.95, // 图片质量95%
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Image load failed: ${file.name}`));
    };
    img.src = url;
  });
};
