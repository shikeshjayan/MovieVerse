/**
 * Similar Movies Component
 * 
 * Fetches and displays movies similar to the current movie being viewed.
 * Implements pagination for loading more results.
 */
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { similarMovies } from "../services/tmdbApi";
import { useWatchHistory } from "../context/WatchHistoryContext";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

const SimilarMovies = () => {
  const { id } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { addToHistory } = useWatchHistory();

  const fetchSimilar = useCallback(async (pageNum, append = false) => {
    try {
      const data = await similarMovies(id, pageNum);
      if (append) {
        setMovies((prev) => [...prev, ...data.results]);
      } else {
        setMovies(data.results || []);
      }
      setHasMore(pageNum < data.totalPages);
    } catch (err) {
      console.error("Failed to fetch similar movies", err);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchSimilar(1).finally(() => setLoading(false));
  }, [fetchSimilar]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchSimilar(nextPage, true)
      .then(() => setPage(nextPage))
      .finally(() => setLoadingMore(false));
  }, [page, hasMore, loadingMore, fetchSimilar]);

  const handleItemClick = (item) => {
    addToHistory({
      id: item.id,
      title: item.title,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      type: "movie",
    });
  };

  return (
    <UniversalCarousel
      title="You might also like"
      items={movies}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      renderItem={(movie) => (
        <MediaCard
          key={movie.id}
          item={movie}
          type="movie"
          onClick={() => handleItemClick(movie)}
        />
      )}
    />
  );
};

export default SimilarMovies;
