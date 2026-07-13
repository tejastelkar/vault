import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  for (const model of ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite']) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: [
          { role: 'user', parts: [{ text: "Hello" }] }
        ]
      });
      console.log(model, "success:", response.text);
      return;
    } catch (err) {
      console.error(model, "Error:", err.message);
    }
  }
}
test();
