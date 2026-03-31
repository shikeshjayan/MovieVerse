import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { similarShows } from "../services/tmdbApi";
import { useWatchHistory } from "../context/WatchHistoryContext";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

const SimilarTvShows = () => {
  const { id } = useParams();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { addToHistory } = useWatchHistory();

  const fetchSimilar = useCallback(async (pageNum, append = false) => {
    try {
      const data = await similarShows(id, pageNum);
      if (append) {
        setShows((prev) => [...prev, ...data.results]);
      } else {
        setShows(data.results || []);
      }
      setHasMore(pageNum < data.totalPages);
    } catch (err) {
      console.error("Failed to fetch similar TV shows", err);
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
      title: item.name || item.title,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      type: "tv",
    });
  };

  return (
    <UniversalCarousel
      title="You might also like"
      items={shows}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      renderItem={(show) => (
        <MediaCard
          key={show.id}
          item={show}
          type="tv"
          onClick={() => handleItemClick(show)}
        />
      )}
    />
  );
};

export default SimilarTvShows;
