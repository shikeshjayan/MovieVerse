import { GoogleGenerativeAI } from "@google/generative-ai";

export const getMovieSuggestionsFromGemini = async (userQuery) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    Suggest exactly 10 movies/TV shows for: "${userQuery}"
    Return ONLY a raw JSON array. No markdown, no backticks, no preamble.
    Format: [{"title": string, "year": number, "type": "movie"|"tv", "reason": string}]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Extra safety: remove markdown blocks if Gemini ignores the "no backticks" rule
    const cleanJson = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    throw err;
  }
};
