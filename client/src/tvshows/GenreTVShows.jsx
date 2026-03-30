import { useEffect, useState, useCallback } from "react";
import { fetchTvShowsByGenre } from "../services/tmdbApi";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

const GenreTVShows = ({ genreId, title }) => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchShows = useCallback(async (pageNum, append = false) => {
    try {
      const data = await fetchTvShowsByGenre(genreId, pageNum);
      if (append) {
        setShows((prev) => [...prev, ...data.results]);
      } else {
        setShows(data.results || []);
      }
      setHasMore(pageNum < data.totalPages);
    } catch {
      setError(`Failed to load ${title}`);
    }
  }, [genreId, title]);

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

  if (!loading && shows.length === 0) return null;

  return (
    <UniversalCarousel
      title={title}
      items={shows}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      renderItem={(show) => (
        <MediaCard key={show.id} item={show} type="tv" />
      )}
    />
  );
};

export default GenreTVShows;
