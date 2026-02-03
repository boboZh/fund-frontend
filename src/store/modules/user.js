const createAuthModule = (set) => ({
  user: localStorage.getItem("user") || null,
  nickname: localStorage.getItem("nickname") || null,
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
