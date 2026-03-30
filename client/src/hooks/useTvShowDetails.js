import { useEffect, useState } from "react";
import { showsDetails, showVideos } from "../services/tmdbApi";

/**
 * Custom hook to fetch TV show details and associated videos
 * @param {number|string} showId - The TMDB TV show ID
 * @returns {object} - { show, showKey, loading }
 *   - show: object | null — detailed TV show information
 *   - showKey: array | null — list of video objects (trailers, clips)
 *   - loading: boolean — indicates if data is being fetched
 */
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
