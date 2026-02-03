import axios from "axios";
import type { AxiosError, AxiosResponse } from "axios";
import useStore from "@/store";

const request = axios.create({
  timeout: 30000,
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

request.interceptors.request.use(
  (config: any) => {
    const token = useStore.getState().token;
    if (token) {
      config.headers["accessToken"] = `Bearer ${token}`;
    }
    console.log("rquest: ", config);
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message, data } = response.data;

    // switch (true) {
    //   case ["0000", 0, "00"].includes(code):
    //     return Promise.resolve(data);
    //   case code == "0006":
    //     console.error("未登录或登录已失效");
    //     return Promise.reject("未登录或登录已失效");
    //   case code == "9999":
    //     return Promise.reject(message);
    //   default:
    //     return Promise.reject(message);
    // }
    return Promise.resolve(response.data);
  },
  (error: AxiosError) => {
    if (
      error.response?.status === 401 ||
      (error.message && error.message.indexOf("code 401") > -1)
    ) {
      useStore.getState().setLogout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default request;
