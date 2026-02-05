const createChatModule = (set) => ({
  history: [], // 历史记录先存在indexDB
  curChat: null, // {id: '', name: ''}
  chatList: [],
  setHistory() {
    set({ history: [] });
  },
  setCurChat() {
    set({ curChat: {} });
  },
  setChatList() {
    set({ chatList: [] });
  },
});
