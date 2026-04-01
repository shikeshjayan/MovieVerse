/**
 * useMovieDetails Hook
 * 
 * Fetches detailed movie information and associated videos from TMDB API.
 * Returns movie data, video keys for trailers, and loading state.
 * 
 * @param {number|string} movieId - TMDB movie ID
 * @returns {{ movie: object|null, movieKey: array|null, loading: boolean }}
 */
import { useEffect, useState } from "react";
import { movieDetails, movieVideos } from "../services/tmdbApi";

const useMovieDetails = (movieId) => {
  const [movie, setMovie] = useState(null);      // Movie details
  const [movieKey, setMovieKey] = useState(null); // Movie videos
  const [loading, setLoading] = useState(true);   // Loading state

  useEffect(() => {
    if (!movieId) return; // Skip if no ID provided

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch movie details and videos concurrently
        const [details, videos] = await Promise.all([
          movieDetails(movieId),
          movieVideos(movieId),
        ]);

        setMovie(details);
        setMovieKey(videos);
      } catch (error) {
        console.error("Failed to fetch movie data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

  return { movie, movieKey, loading };
};

export default useMovieDetails;
