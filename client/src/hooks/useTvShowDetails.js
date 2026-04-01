/**
 * useTvShowDetails Hook
 * 
 * Fetches detailed TV show information and associated videos from TMDB API.
 * Returns show data, video keys for trailers, and loading state.
 * 
 * @param {number|string} showId - TMDB TV show ID
 * @returns {{ show: object|null, showKey: array|null, loading: boolean }}
 */
import { useEffect, useState } from "react";
import { showsDetails, showVideos } from "../services/tmdbApi";

const useTvShowDetails = (showId) => {
  const [show, setShow] = useState(null);      // TV show details
  const [showKey, setShowKey] = useState(null); // TV show videos
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    if (!showId) return; // Skip if no ID provided

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch TV show details and videos concurrently
        const [details, videos] = await Promise.all([
          showsDetails(showId),
          showVideos(showId),
        ]);

        setShow(details);
        setShowKey(videos);
      } catch (error) {
        console.error("Failed to fetch TV show data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showId]);

  return { show, showKey, loading };
};

export default useTvShowDetails;
