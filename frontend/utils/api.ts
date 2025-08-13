import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { 
  AuthResponse, 
  LoginData, 
  RegisterData, 
  User, 
  Activity, 
  ActivityCreate, 
  ActivityRating,
  Mood,
  MoodCreate,
  Partner,
  Achievement,
  DashboardStats,
  LinkPartnerData
} from '../types';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const couplesAPI = {
  linkPartner: async (data: LinkPartnerData): Promise<{ message: string }> => {
    const response = await api.post('/couples/link-partner', data);
    return response.data;
  },

  getMyPartner: async (): Promise<Partner> => {
    const response = await api.get('/couples/my-partner');
    return response.data;
  },
};

export const activitiesAPI = {
  create: async (data: ActivityCreate): Promise<{ message: string; activity_id: string }> => {
    const response = await api.post('/activities/create', data);
    return response.data;
  },

  getMyActivities: async (): Promise<Activity[]> => {
    const response = await api.get('/activities/my-activities');
    return response.data;
  },

  getPartnerActivities: async (): Promise<Activity[]> => {
    const response = await api.get('/activities/partner-activities');
    return response.data;
  },

  rateActivity: async (activityId: string, data: ActivityRating): Promise<{ message: string }> => {
    const response = await api.post(`/activities/${activityId}/rate`, data);
    return response.data;
  },

  getPendingRatings: async (): Promise<Activity[]> => {
    const response = await api.get('/activities/pending-ratings');
    return response.data;
  },

  getSpecialMemories: async (): Promise<Activity[]> => {
    const response = await api.get('/activities/special-memories');
    return response.data;
  },
};

export const moodsAPI = {
  create: async (data: MoodCreate): Promise<{ message: string }> => {
    const response = await api.post('/moods/create', data);
    return response.data;
  },

  getMyMoods: async (): Promise<Mood[]> => {
    const response = await api.get('/moods/my-moods');
    return response.data;
  },

  getPartnerMood: async (): Promise<Mood | null> => {
    try {
      const response = await api.get('/moods/partner-mood');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

export const achievementsAPI = {
  getMyAchievements: async (): Promise<Achievement[]> => {
    const response = await api.get('/achievements/my-achievements');
    return response.data;
  },

  checkNew: async (): Promise<{ message: string }> => {
    const response = await api.get('/achievements/check-new');
    return response.data;
  },
};

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export default api;