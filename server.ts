import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, image, context } = req.body;
      
      let systemInstruction = "You are an expert personalized Ai health, fitness, and gym coach. Users can ask you about workouts, diet, body pain, supplements, and fitness routines. Start the conversation natively in Hinglish if the user asks in Hinglish, or English if they ask in English. Keep the tone friendly, motivating, and highly professional like a personal trainer. Do not mention you are an AI model like Gemini, act as a real digital fitness coach. If user uploads an image of food, supplement or anything, analyze it and act accordingly.";
      
      if (context) {
        systemInstruction += `\n\nHere is the current member's context to help you analyze their queries better, but do NOT reveal that you can see this data unless relevant to their question:
- Basic Details: ${JSON.stringify(context.member)}
- Dashboard Summary (Days Left, Body Weight, etc.): ${JSON.stringify(context.dashboardSummary)}
- Current Plan: ${JSON.stringify(context.currentPlan)}
- Attendance History: ${JSON.stringify(context.attendance)}
- Payment History: ${JSON.stringify(context.payments)}`;
      }

      const chatOptions = {
        model: "gemini-2.5-flash",
        config: {
          systemInstruction,
        },
      };

      const contents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          const parts = [];
          if (msg.text) parts.push({ text: msg.text });
          // Note we don't send past images to save tokens, or we can if we store them. We will just send history texts.
          contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts });
        }
      }
      
      const currentUserParts = [];
      if (image) {
        currentUserParts.push({ inlineData: image.inlineData });
      }
      if (message) {
        currentUserParts.push({ text: message });
      }
      contents.push({ role: 'user', parts: currentUserParts });

      const response = await getAiClient().models.generateContent({
        model: chatOptions.model,
        contents: contents,
        config: chatOptions.config
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to generate response" });
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
