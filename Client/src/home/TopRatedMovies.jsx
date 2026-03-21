import { useEffect, useState, useCallback } from "react";
import { topRatedMovies } from "../services/tmdbApi";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

const TopRatedMovies = ({ movies: propMovies }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTopRated = useCallback(async (pageNum, append = false) => {
    try {
      const data = await topRatedMovies(pageNum);
      if (append) {
        setMovies((prev) => [...prev, ...data.results]);
      } else {
        setMovies(data.results);
      }
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load top rated movies");
    }
  }, []);

  useEffect(() => {
    if (propMovies && propMovies.length > 0) {
      setMovies(propMovies);
      setLoading(false);
      return;
    }
    fetchTopRated(1).finally(() => setLoading(false));
  }, [propMovies, fetchTopRated]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchTopRated(nextPage, true)
      .then(() => setPage(nextPage))
      .finally(() => setLoadingMore(false));
  }, [page, totalPages, loadingMore, fetchTopRated]);

  return (
    <UniversalCarousel
      title="Top Rated Movies"
      items={movies}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={page < totalPages}
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

export default TopRatedMovies;
