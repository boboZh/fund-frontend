import { handleExpired } from "./request";
import { toast } from "sonner";

export const myFetch = async (url: string, options: RequestInit) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    if (response.status === 401) {
      handleExpired();
    }
    const error = await response.json().catch(() => ({ message: "未知错误" }));
    return Promise.reject(error);
  }
  return response;
};
