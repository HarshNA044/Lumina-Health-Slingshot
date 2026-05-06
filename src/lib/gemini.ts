import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze this meal based on the description${imageUrl ? ' and image' : ''}. 
  Description: "${description}"
  Provide nutritional estimate and health score (1-10).
  Format the output as JSON.`;

  const contents = imageUrl ? {
    parts: [
      { text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: imageUrl.split(',')[1] } }
    ]
  } : prompt;

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          macronutrients: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER }
            },
            required: ["protein", "carbs", "fat"]
          },
          healthScore: { type: Type.NUMBER },
          analysis: { type: Type.STRING }
        },
        required: ["calories", "macronutrients", "healthScore", "analysis"]
      }
    }
  });

  return JSON.parse(response.text) as MealAnalysis;
}

export async function getHealthInsights(meals: any[], habits: any[]): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Based on the following meal history and tracked habits, provide 3 punchy, actionable health insights or tips for this user.
  Meals: ${JSON.stringify(meals.slice(0, 5))}
  Habits: ${JSON.stringify(habits)}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: "You are Lumina, a supportive and intelligent nutritional companion. Keep insights concise and encouraging."
    }
  });

  return response.text;
}
