import { useEffect, useState } from "react";
import { movieDetails, movieVideos } from "../services/tmdbApi";

/**
 * Custom hook to fetch movie details and associated videos
 * @param {number|string} movieId - The TMDB movie ID
 * @returns {object} - { movie, movieKey, loading }
 *   - movie: object | null — detailed movie information
 *   - movieKey: array | null — list of video objects (trailers, clips)
 *   - loading: boolean — indicates if data is being fetched
 */
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
