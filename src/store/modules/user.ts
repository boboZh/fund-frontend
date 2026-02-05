import { type StateCreator } from "zustand";

export interface User {
  user_id: number;
  nickname: string;
  phone: number;
  role_id: number;
  role_name: string;
  permissions: string[];
}
export interface AuthSlice {
  user: User | null;
  nickname: string | null;
  token?: string | null; // token有待完善
  isLoggedIn: boolean;
  setLogin: (data: User) => void;
  setLogout: () => void;
}

const createAuthModule: StateCreator<AuthSlice> = (set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  nickname: localStorage.getItem("nickname"),
  isLoggedIn: !!localStorage.getItem("nickname"),

  setLogin: (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("nickname", userData.nickname);
    set({ user: userData, nickname: userData.nickname, isLoggedIn: true });
  },

  setLogout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("nickname");
    set({ user: null, nickname: null, isLoggedIn: false });
  },
});

export default createAuthModule;
