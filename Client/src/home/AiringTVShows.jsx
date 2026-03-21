import { useEffect, useState, useCallback } from "react";
import { airingTodayTVShows } from "../services/tmdbApi";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

const AiringTVShows = ({ shows: propShows }) => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchShows = useCallback(async (pageNum, append = false) => {
    try {
      const data = await airingTodayTVShows(pageNum);
      if (append) {
        setShows((prev) => [...prev, ...data.results]);
      } else {
        setShows(data.results);
      }
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load airing TV shows");
    }
  }, []);

  useEffect(() => {
    if (propShows && propShows.length > 0) {
      setShows(propShows);
      setLoading(false);
      return;
    }
    fetchShows(1).finally(() => setLoading(false));
  }, [propShows, fetchShows]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchShows(nextPage, true)
      .then(() => setPage(nextPage))
      .finally(() => setLoadingMore(false));
  }, [page, totalPages, loadingMore, fetchShows]);

  return (
    <UniversalCarousel
      title="Airing Today"
      items={shows}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={page < totalPages}
      onLoadMore={handleLoadMore}
      renderItem={(show) => (
        <MediaCard
          key={show.id}
          item={show}
          type="tv"
        />
      )}
    />
  );
};

export default AiringTVShows;
