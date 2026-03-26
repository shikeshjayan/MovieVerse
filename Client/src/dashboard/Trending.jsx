import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { trendingAllPaginated } from "../services/tmdbApi";
import { useAuth } from "../context/AuthContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { useWishlist } from "../context/WishlistContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faDeleteLeft, faHeart } from "@fortawesome/free-solid-svg-icons";

import UniversalCarousel from "../ui/UniversalCarousel";
import BlurImage from "../ui/BlurImage";
import MediaSkeleton from "../ui/MediaSkeleton";

const PLACEHOLDER_POSTER = "/over.jpg";

const Trending = () => {
  const [trending, setTrending] = useState([]);
  const [timeWindow, setTimeWindow] = useState("day");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } = useWatchLater();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToHistory } = useWatchHistory();

  const handleItemClick = (item) => {
    if (!user) {
      navigate("/login", {
        state: { from: `/${item.media_type === "movie" ? "movie" : "tvshow"}/${item.id}` },
        replace: true,
      });
      return;
    }

    addToHistory({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      type: item.media_type === "movie" ? "movie" : "tvshow",
    });

    navigate(`/${item.media_type === "movie" ? "movie" : "tvshow"}/${item.id}`);
  };

  const getType = (mediaType) => (mediaType === "movie" ? "movie" : "tv");

  const fetchTrending = useCallback(async (pageNum, append = false) => {
    try {
      const data = await trendingAllPaginated(timeWindow, pageNum);
      const filtered = (data.results || []).filter(
        (item) => item.media_type === "movie" || item.media_type === "tv"
      );
      if (append) {
        setTrending((prev) => [...prev, ...filtered]);
      } else {
        setTrending(filtered);
      }
      setHasMore(pageNum < data.totalPages);
    } catch (error) {
      console.error("Failed to fetch trending items:", error);
    }
  }, [timeWindow]);

  useEffect(() => {
    setLoading(true);
    fetchTrending(1).finally(() => setLoading(false));
  }, [timeWindow, fetchTrending]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchTrending(nextPage, true)
      .then(() => setPage(nextPage))
      .finally(() => setLoadingMore(false));
  }, [page, hasMore, loadingMore, fetchTrending]);

  return (
    <div className="p-6">
      {/* Section Title */}
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-blue-100">Trending All</h2>

      {/* Time Window Switch */}
      <div className="mb-4 flex gap-2">
        {["day", "week"].map((tw) => (
          <button
            key={tw}
            onClick={() => setTimeWindow(tw)}
            className={`px-4 py-2 rounded ${
              timeWindow === tw
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            } transition-colors`}
          >
            {tw === "day" ? "Today" : "This Week"}
          </button>
        ))}
      </div>

      {/* Horizontal Carousel */}
      <UniversalCarousel
        items={trending}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        renderItem={(item) => {
          const type = getType(item.media_type);
          const isInWatchLaterFlag = isInWatchLater(item.id);

          return (
            <motion.div
              key={item.id}
              className="shrink-0 w-40 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative cursor-pointer" onClick={() => handleItemClick(item)}>
                <BlurImage
                  src={
                    item.poster_path
                      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                      : PLACEHOLDER_POSTER
                  }
                  alt={item.title || item.name || "Unknown"}
                  className="rounded-lg shadow-md w-full h-64 object-cover"
                />

                {/* Watch Later Button */}
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      isInWatchLaterFlag
                        ? removeFromWatchLater(item.id, type)
                        : addToWatchLater(item, type);
                    }}
                    className="absolute top-2 left-2 bg-black/70 text-white p-2 rounded text-sm
                      opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 cursor-pointer shadow"
                    aria-label={isInWatchLaterFlag ? "Remove from watch later" : "Add to watch later"}>
                    <FontAwesomeIcon icon={isInWatchLaterFlag ? faDeleteLeft : faClock} />
                  </button>
                )}

                {/* Wishlist Button */}
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      isInWishlist(item.id, type)
                        ? removeFromWishlist(item.id, type)
                        : addToWishlist({
                            id: item.id,
                            title: item.title || item.name,
                            poster_path: item.poster_path,
                            vote_average: item.vote_average,
                            type: type,
                          });
                    }}
                    className="absolute top-2 right-2 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
                    aria-label={isInWishlist(item.id, type) ? "Remove from wishlist" : "Add to wishlist"}>
                    <FontAwesomeIcon
                      icon={faHeart}
                      style={{ color: isInWishlist(item.id, type) ? "#FF0000" : "#FFFFFF" }}
                      className="cursor-pointer shadow"
                    />
                  </button>
                )}

                {/* Rating Badge */}
                <span className="absolute bottom-10 left-2 bg-yellow-500 text-black font-bold text-xs px-2 py-1 rounded">
                  ★ {item.vote_average?.toFixed(1) ?? "N/A"}
                </span>

                <h5 className="mt-2 text-sm font-semibold truncate">
                  {item.title || item.name || "Unknown"}
                </h5>
              </div>
            </motion.div>
          );
        }}
        SkeletonComponent={MediaSkeleton}
        skeletonCount={5}
      />

      {/* No Trending Message */}
      {!loading && trending.length === 0 && (
        <p className="text-gray-400 dark:text-blue-300 mt-2">No trending items available.</p>
      )}
    </div>
  );
};

export default Trending;
