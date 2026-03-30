import { useEffect, useState, useCallback } from "react";
import { fetchMoviesByGenre } from "../services/tmdbApi";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

const GenreMovies = ({ genreId, title }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMovies = useCallback(async (pageNum, append = false) => {
    try {
      const data = await fetchMoviesByGenre(genreId, pageNum);
      if (append) {
        setMovies((prev) => [...prev, ...data.results]);
      } else {
        setMovies(data.results || []);
      }
      setHasMore(pageNum < data.totalPages);
    } catch {
      setError(`Failed to load ${title}`);
    }
  }, [genreId, title]);

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

  if (!loading && movies.length === 0) return null;

  return (
    <UniversalCarousel
      title={title}
      items={movies}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      renderItem={(movie) => (
        <MediaCard key={movie.id} item={movie} type="movie" />
      )}
    />
  );
};

export default GenreMovies;
