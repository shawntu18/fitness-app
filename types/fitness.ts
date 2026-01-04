export type ExerciseType = 'cardio' | 'strength';

export interface FitnessLog {
  id: string;
  user_id: string;
  date: string; // Supabase 返回的是 ISO string
  duration: number;
  type: ExerciseType;
  calories: number;
  weight: number | null;
  checked_in: boolean;
  created_at: string;
}

export interface Stats {
  totalDays: number;
  progress: number;
  totalCalories: number;
  totalDuration: number;
  currentStreak: number;
}
