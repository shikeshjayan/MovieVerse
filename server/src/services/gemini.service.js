/**
 * Gemini AI Service for Smart Search
 * Uses Google Gemini to generate contextual movie/TV recommendations
 * from natural language queries
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import NodeCache from "node-cache";

// Cache suggestions for 1 hour to reduce API calls
const geminiCache = new NodeCache({ stdTTL: 60 * 60 });

/**
 * Get movie/TV suggestions from Gemini AI based on natural language query
 * @param {string} userQuery - User's search query (can be mood, genre, plot description, etc.)
 * @returns {Array} Array of suggested movies/TV shows with reasons
 */
export const getMovieSuggestionsFromGemini = async (userQuery) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  // Normalize cache key to handle minor query variations
  const cacheKey = userQuery.toLowerCase().trim().replace(/\s+/g, " ");
  const cached = geminiCache.get(cacheKey);
  if (cached) {
    console.log("[Gemini] Cache hit:", cacheKey);
    return cached;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
You are a movie and TV show recommendation engine for a streaming discovery app.

The user typed: "${userQuery}"

Your task:
1. Understand what the user is looking for — this could be a mood ("something scary"), a genre ("90s action"), a theme ("movies about AI"), a plot description ("heist in space"), an actor/director name, or a specific title.
2. If the query is NOT about movies or TV shows (e.g. "what's the weather"), return an empty array [].
3. Suggest exactly 8 real, well-known movies or TV shows that match the query.
4. Prioritize titles that are popular and definitely on TMDB — avoid obscure films that might not be found.
5. Vary between movies and TV shows when both are relevant.
6. The "reason" field must be a SHORT, specific sentence (max 10 words) explaining why this title matches — reference the user's exact query words.

Return ONLY a raw JSON array. No markdown, no backticks, no explanation, no preamble.
Schema: [{"title": string, "year": number, "type": "movie" | "tv", "reason": string}]

Examples of good reasons:
- "Perfect heist thriller set in outer space"
- "Iconic 90s action film with great stunts"
- "Explores AI consciousness and ethical dilemmas"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean up markdown formatting if present
    const cleanJson = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(cleanJson);
    
    if (!Array.isArray(parsed)) return [];

    // Validate and filter results
    const filtered = parsed.filter(item =>
      item.title &&
      typeof item.title === "string" &&
      ["movie", "tv"].includes(item.type)
    );

    geminiCache.set(cacheKey, filtered);
    return filtered;
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    throw err;
  }
};
