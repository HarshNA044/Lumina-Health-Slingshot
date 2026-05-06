export interface MealAnalysis {
  calories: number;
  macronutrients: {
    protein: number;
    carbs: number;
    fat: number;
  };
  healthScore: number;
  analysis: string;
}

export async function analyzeMeal(description: string, imageUrl?: string): Promise<MealAnalysis> {
  const response = await fetch("/api/analyze-meal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, imageUrl }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to analyze meal");
  }

  return response.json();
}

export async function getHealthInsights(meals: any[], habits: any[], weightLogs: any[]): Promise<string> {
  const response = await fetch("/api/health-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meals, habits, weightLogs }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to get insights");
  }

  const data = await response.json();
  return data.text;
}
