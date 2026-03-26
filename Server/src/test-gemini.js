// Server/src/test-gemini.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") }); // adjust path to your .env
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);
import { getMovieSuggestionsFromGemini } from "./services/gemini.service.js";

const result = await getMovieSuggestionsFromGemini(
  "I feel lonely, suggest movies",
);
console.log(JSON.stringify(result, null, 2));
