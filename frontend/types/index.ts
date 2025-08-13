export interface User {
  id: string;
  name: string;
  email: string;
  partner_code?: string;
  has_partner: boolean;
  created_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export enum ActivityCategory {
  FISICO = "físico",
  EMOCIONAL = "emocional",
  PRACTICO = "práctico",
  GENERAL = "general"
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  giver_id: string;
  receiver_id: string;
  rating?: number;
  comment?: string;
  created_at: string;
  rated_at?: string;
}

export interface ActivityCreate {
  title: string;
  description: string;
  category: ActivityCategory;
  receiver_id: string;
}

export interface ActivityRating {
  rating: number;
  comment?: string;
}

export enum MoodEmoji {
  VERY_SAD = "😢",
  SAD = "😔",
  NEUTRAL = "😐",
  HAPPY = "😊",
  VERY_HAPPY = "🥰"
}

export interface Mood {
  id: string;
  user_id: string;
  mood_emoji: MoodEmoji;
  note?: string;
  date: string;
}

export interface MoodCreate {
  mood_emoji: MoodEmoji;
  note?: string;
}

export interface Partner {
  id: string;
  name: string;
  latest_mood?: MoodEmoji;
  mood_note?: string;
  mood_date?: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string;
  unlocked_at: string;
}

export interface DashboardStats {
  total_activities_given: number;
  total_activities_received: number;
  average_rating_given: number;
  average_rating_received: number;
  current_streak: number;
  achievements_count: number;
  pending_ratings: number;
}

export interface LinkPartnerData {
  code: string;
}