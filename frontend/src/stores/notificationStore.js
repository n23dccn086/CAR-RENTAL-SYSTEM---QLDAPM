import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),

  fetchUnreadCount: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ unreadCount: 0 });
      return;
    }
    try {
      const res = await api.get('/notifications/unread-count');
      const count = typeof res.data?.data === 'number' ? res.data.data : (res.data || 0);
      set({ unreadCount: Math.max(0, count) });
    } catch {
      // Bỏ qua nếu lỗi mạng hoặc token chưa sẵn sàng
    }
  },

  decrementUnread: () => {
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
  },

  clearUnread: () => {
    set({ unreadCount: 0 });
  },
}));

