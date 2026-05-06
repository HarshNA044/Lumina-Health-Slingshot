export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
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
