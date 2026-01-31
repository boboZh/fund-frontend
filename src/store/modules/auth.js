const createAuthModule = (set) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  isLoggedIn: !!localStorage.getItem("token"),

  setLogin: (userData, token) => {
    localStorage.setItem("token", token);
    set({ user: userData, token, isLoggedIn: true });
  },

  setLogout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, isLoggedIn: false });
  },
});

export default createAuthModule;
