import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Gemini API Proxy
  app.post("/api/analyze-meal", async (req, res) => {
    try {
      const { description, imageUrl } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Analyze this meal based on the description${imageUrl ? ' and image' : ''}. 
      Description: "${description}"
      Provide nutritional estimate and health score (1-10).
      You have expert knowledge of diverse cuisines, especially Indian food.
      Format the output as JSON.`;

      const contents = imageUrl ? {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: imageUrl.split(',')[1] } }
        ]
      } : prompt;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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

      res.json(JSON.parse(result.text || "{}"));
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/health-insights", async (req, res) => {
    try {
      const { meals, habits, weightLogs } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Based on the following meal history, tracked habits, and weight logs, provide 3 punchy, actionable health insights or tips for this user.
      Meals (recent): ${JSON.stringify(meals.slice(0, 5))}
      Habits: ${JSON.stringify(habits)}
      Weight Logs (recent): ${JSON.stringify(weightLogs)}`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are Lumina, a supportive and intelligent nutritional companion with deep expertise in Indian diets and global nutrition. Keep insights concise, culturally relevant, and encouraging."
        }
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
