import { useEffect, useState, useCallback } from "react";
import { popularTVShows } from "../services/tmdbApi";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

const TvShowcase = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchShows = useCallback(async (pageNum, append = false) => {
    try {
      const data = await popularTVShows(pageNum);
      if (append) {
        setShows((prev) => [...prev, ...data.results]);
      } else {
        setShows(data.results);
      }
      setHasMore(pageNum < data.totalPages);
    } catch {
      setError("Failed to load TV shows");
    }
  }, []);

  useEffect(() => {
    fetchShows(1).finally(() => setLoading(false));
  }, [fetchShows]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchShows(nextPage, true)
      .then(() => setPage(nextPage))
      .finally(() => setLoadingMore(false));
  }, [page, hasMore, loadingMore, fetchShows]);

  return (
    <UniversalCarousel
      title="Popular TV Shows"
      items={shows}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={hasMore}
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

export default TvShowcase;
