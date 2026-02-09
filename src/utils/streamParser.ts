import type { AiTaskType, AiTaskStatus } from "@/types/ai";
export const streamParser = (
  _buffer: string,
  updateLastMsgContent: (text: string) => void,
  setStepStatus: (taskId: string, type: AiTaskStatus, text: string) => void,
) => {
  let buffer = _buffer;
  while (true) {
    const startTag = "[S:",
      endTag = "]";

    const startTagLen = startTag.length,
      endTagLen = endTag.length;

    const startIdx = buffer.indexOf(startTag);
    const endIdx = buffer.indexOf(endTag, startIdx);
    if (startIdx > -1 && endIdx > -1) {
      const before = buffer.substring(0, startIdx);
      if (before) updateLastMsgContent(before);

      const signal = buffer.substring(startIdx + startTagLen, endIdx);
      const [taskId, status, ...text] = signal.split(":");

      setStepStatus(taskId, status as AiTaskStatus, text.join(":"));
      buffer = buffer.substring(endIdx + endTagLen);
    } else {
      if (startIdx === -1) {
        // 完全没看到标签，但是为了防止流被截断，预留前置标签的长度，等待后面的chunk拼接
        const outputLimit = Math.max(0, buffer.length - startTagLen); // 5是信号头的预估长度
        if (outputLimit > 0) {
          updateLastMsgContent(buffer.substring(0, outputLimit));
          buffer = buffer.substring(outputLimit);
        }
      } else {
        if (startIdx > 0) {
          // 有前置标签，先把前置标签前一部分的正文内容返回给用户
          updateLastMsgContent(buffer.substring(0, startIdx));
          buffer = buffer.substring(startIdx);
        }
      }
      break;
    }
  }
  return buffer;
};
