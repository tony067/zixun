import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { fetchCurrentUser } from '@/services/api';

interface UserInfo {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isAdmin?: boolean;
  isTester?: boolean;
  role?: string;
  userType?: string;
  type?: string;
}

interface UserStore {
  user: UserInfo | null;
  isLoggedIn: boolean;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
  init: () => Promise<void>;
  setRole: (role: 'client' | 'counselor' | 'admin') => void;
  currentRole: 'client' | 'counselor' | 'admin';
}

const STORAGE_KEY = 'mindpace_user';

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoggedIn: false,
  currentRole: 'client',

  login: (userInfo) => {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(userInfo));
    const userDbRole = userInfo.role || userInfo.userType || userInfo.type || 'client';
    const currentRole = userDbRole === 'counselor' ? 'counselor' : 'client';
    set({ user: userInfo, isLoggedIn: true, currentRole });
  },

  logout: () => {
    Taro.removeStorageSync(STORAGE_KEY);
    Taro.removeStorageSync('token');
    set({ user: null, isLoggedIn: false, currentRole: 'client' });
  },

  setRole: (role) => {
    set({ currentRole: role });
  },

  init: async () => {
    // 先从本地存储恢复，实现快速显示
    try {
      const stored = Taro.getStorageSync(STORAGE_KEY);
      if (stored) {
        const userInfo = JSON.parse(stored);
        const userDbRole = userInfo.role || userInfo.userType || userInfo.type || 'client';
        const currentRole = userDbRole === 'counselor' ? 'counselor' : 'client';
        set({ user: userInfo, isLoggedIn: true, currentRole });
      }
    } catch {
      // ignore
    }

    // 如果有 token，从服务器验证并获取最新用户信息
    const token = Taro.getStorageSync('token');
    if (token) {
      try {
        const user = await fetchCurrentUser();
        if (user) {
          const userInfo: UserInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatarUrl,
            isAdmin: user.isAdmin,
            isTester: user.isTester,
            role: user.role,
            userType: user.userType,
            type: user.type,
          };
          Taro.setStorageSync(STORAGE_KEY, JSON.stringify(userInfo));
          const userDbRole = user.role || user.userType || user.type || 'client';
          const currentRole = userDbRole === 'counselor' ? 'counselor' : 'client';
          set({ user: userInfo, isLoggedIn: true, currentRole });
        } else {
          // token 无效，清除登录状态
          Taro.removeStorageSync(STORAGE_KEY);
          Taro.removeStorageSync('token');
          set({ user: null, isLoggedIn: false });
        }
      } catch {
        // 网络错误时保持本地存储的登录状态
      }
    }
  }
}));