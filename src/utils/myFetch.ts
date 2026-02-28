import { handleExpired } from "./request";

export const myFetch = async (url: string, options: RequestInit) => {
  console.log("options: ", options);
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
