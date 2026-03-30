import { useEffect, useState, useCallback } from "react";
import { popularMovies } from "../services/tmdbApi";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

const Moviecase = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMovies = useCallback(async (pageNum, append = false) => {
    try {
      const data = await popularMovies(pageNum);
      if (append) {
        setMovies((prev) => [...prev, ...data.results]);
      } else {
        setMovies(data.results);
      }
      setHasMore(pageNum < data.totalPages);
    } catch {
      setError("Failed to load movies");
    }
  }, []);

  useEffect(() => {
    fetchMovies(1).finally(() => setLoading(false));
  }, [fetchMovies]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchMovies(nextPage, true)
      .then(() => setPage(nextPage))
      .finally(() => setLoadingMore(false));
  }, [page, hasMore, loadingMore, fetchMovies]);

  return (
    <UniversalCarousel
      title="Popular Movies"
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

export default Moviecase;
