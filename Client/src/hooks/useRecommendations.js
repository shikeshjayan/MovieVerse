// src/hooks/useRecommendations.js
import { useState, useEffect, useContext } from "react";
import { getRecommendationsService } from "../services/axiosApi.js";
import { AuthContext } from "../context/AuthContext";

const useRecommendations = () => {
  const { user } = useContext(AuthContext);

  const [movies, setMovies] = useState([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const getRecommendations = async () => {
      try {
        const data = await getRecommendationsService();
        if (!cancelled) {
          console.log("[Recommendations] API Response source:", data.source);
          console.log("[Recommendations] API Response full:", data);
          const rawMovies = data.data ?? [];
          const normalized = rawMovies.map((m) => ({
            id: m.tmdbId || m.id,
            title: m.title,
            poster_path: m.posterPath || m.poster_path,
            vote_average: m.voteAverage || m.vote_average,
            mediaType: m.mediaType,
          }));
          setMovies(normalized);
          setSource(data.source ?? "");
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error.response?.data?.message || "Failed to load recommendations",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    getRecommendations();

    return () => {
      cancelled = true;
    };
  }, [user]); // ✅ re-fetches when user logs in/out

  return { movies, source, loading, error };
};

export default useRecommendations;
