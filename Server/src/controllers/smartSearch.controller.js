import { getMovieSuggestionsFromGemini } from "../services/gemini.service.js";
import axios from "axios";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY;

const searchTMDB = async (title, year, type) => {
  try {
    const endpoint = type === "tv" ? "search/tv" : "search/movie";
    const { data } = await axios.get(`${TMDB_BASE}/${endpoint}`, {
      params: { api_key: TMDB_KEY, query: title, primary_release_year: year, page: 1 },
    });

    const result = data.results?.find(r => {
      const releaseYear = r.release_date || r.first_air_date;
      return !year || (releaseYear && releaseYear.startsWith(String(year)));
    }) || data.results?.[0];
    
    if (!result) return null;

    return {
      id: result.id,
      title: result.title || result.name,
      poster_path: result.poster_path,
      backdrop_path: result.backdrop_path,
      vote_average: result.vote_average,
      overview: result.overview,
      release_date: result.release_date || result.first_air_date,
      media_type: type,
    };
  } catch {
    return null;
  }
};

// POST /api/search/smart
export const smartSearch = async (req, res) => {
  const { query } = req.body;

  if (!query?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Query is required" });
  }

  const sanitizedQuery = query.trim().slice(0, 200);
  if (sanitizedQuery.length < 2) {
    return res
      .status(400)
      .json({ success: false, message: "Query too short (min 2 characters)" });
  }

  const dangerousPatterns = /(<script|javascript:|onerror=|onclick=|eval\(|\\x)/i;
  if (dangerousPatterns.test(sanitizedQuery)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid characters in query" });
  }

  try {
    const suggestions = await getMovieSuggestionsFromGemini(sanitizedQuery);

    if (!suggestions || !Array.isArray(suggestions)) {
      return res.status(500).json({ success: false, message: "Failed to get suggestions" });
    }

    const tmdbResults = await Promise.all(
      suggestions.map(async (s) => {
        const tmdb = await searchTMDB(s.title, s.year, s.type);
        if (!tmdb) return null;
        return { ...tmdb, reason: s.reason };
      }),
    );

    const results = tmdbResults.filter(Boolean);

    res.json({ success: true, query: sanitizedQuery, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || "Smart search failed" });
  }
};
