import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    // Frontend sends: { messages: [{ role: 'user'|'assistant', content: '...' }, ...] }
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    // Convert frontend history → Gemini "contents" format
    // Gemini roles: 'user' and 'model' (not 'assistant')
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite", // ensure this model name is valid
      contents,
    });

    const reply = result.text;

    // Return a JSON object with a `reply` field — matches frontend
    return res.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).json({ error: "generation failed" });
  }
});

app.listen(port, () => {
  console.log(`Server is now running on Port ${port}`);
});