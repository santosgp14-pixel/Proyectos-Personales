import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, LoginData, RegisterData } from '../types';
import { authAPI } from '../utils/api';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (data: LoginData) => {
    try {
      const response = await authAPI.login(data);
      await SecureStore.setItemAsync('auth_token', response.access_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(response.user));
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      await SecureStore.setItemAsync('auth_token', response.access_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(response.user));
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
    set({ 
      user: null, 
      isAuthenticated: false, 
      isLoading: false 
    });
  },

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userData = await SecureStore.getItemAsync('user_data');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        // Verify token is still valid
        try {
          const currentUser = await authAPI.getMe();
          set({ 
            user: currentUser, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          // Token invalid, clear storage
          await get().logout();
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  updateUser: (user: User) => {
    set({ user });
    SecureStore.setItemAsync('user_data', JSON.stringify(user));
  },
}));

export const useAuth = () => {
  const store = useAuthStore();
  return store;
};