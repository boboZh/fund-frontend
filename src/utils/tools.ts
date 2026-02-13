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
