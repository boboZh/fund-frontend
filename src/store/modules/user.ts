import { type StateCreator } from "zustand";

export interface User {
  userId: number;
  nickname: string;
  phone: number;
  roleId: number;
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

const getSafeStorage = (key: string) => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

const createAuthModule: StateCreator<AuthSlice> = (set) => ({
  user: JSON.parse(getSafeStorage("user") || "null"),
  nickname: getSafeStorage("nickname"),
  isLoggedIn: !!getSafeStorage("nickname"),

  setLogin: (userData) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("nickname", userData.nickname);
    }

    set({ user: userData, nickname: userData.nickname, isLoggedIn: true });
  },

  setLogout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("nickname");
    }

    set({ user: null, nickname: null, isLoggedIn: false });
  },
});

export default createAuthModule;
