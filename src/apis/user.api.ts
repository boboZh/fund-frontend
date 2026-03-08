import request, { type ApiResponse } from "../utils/request";
import { type User } from "@/store/modules/user";

// 登录
export const apiLogin = (data: { phone: number; password: string }): Promise<ApiResponse<User>> =>
  request({
    method: "post",
    url: "/user/login",
    data,
  });
