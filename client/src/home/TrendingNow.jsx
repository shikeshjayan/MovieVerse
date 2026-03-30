import { useEffect, useState, useCallback } from "react";
import { trendingMovies } from "../services/tmdbApi";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

const TrendingNow = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTrending = useCallback(async (pageNum, append = false) => {
    try {
      const data = await trendingMovies("week", pageNum);
      if (append) {
        setMovies((prev) => [...prev, ...data.results]);
      } else {
        setMovies(data.results);
      }
      setHasMore(pageNum < data.totalPages);
    } catch {
      setError("Failed to load trending movies");
    }
  }, []);

  useEffect(() => {
    fetchTrending(1).finally(() => setLoading(false));
  }, [fetchTrending]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchTrending(nextPage, true)
      .then(() => setPage(nextPage))
      .finally(() => setLoadingMore(false));
  }, [page, hasMore, loadingMore, fetchTrending]);

  return (
    <UniversalCarousel
      title="Trending Now"
      items={movies}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      renderItem={(movie) => (
        <MediaCard
          key={movie.id}
          item={movie}
          type="movie"
        />
      )}
    />
  );
};

export default TrendingNow;
