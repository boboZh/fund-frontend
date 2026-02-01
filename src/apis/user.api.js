import request from "../utils/request";

// 登录
export const apiLogin = (data = {}) =>
  request({
    method: "post",
    url: "/user/login",
    data,
  });
