export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  weight?: number;
  height?: number;
  points: number;
  level: number;
  goals: string[];
  dietaryPreferences: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface MealLog {
  id?: string;
  userId: string;
  description: string;
  imageUrl?: string;
  calories: number;
  macronutrients: {
    protein: number;
    carbs: number;
    fat: number;
  };
  healthScore: number;
  analysis: string;
  mood?: 'Energetic' | 'Tired' | 'Stressed' | 'Happy' | 'Neutral';
  location?: 'Home' | 'Office' | 'Restaurant' | 'On the go';
  timestamp: any;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly';
  active: boolean;
  createdAt: string;
}

export interface HabitLog {
  id?: string;
  userId: string;
  habitId: string;
  date: string;
  completed: boolean;
  timestamp: any;
}

export interface WeightLog {
  id?: string;
  userId: string;
  weight: number;
  unit: 'kg' | 'lbs';
  date: string;
  timestamp: any;
}

export interface WaterLog {
  id?: string;
  userId: string;
  amount: number; // in glasses
  date: string;
  timestamp: any;
}
