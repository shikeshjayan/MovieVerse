import { useEffect, useState } from "react";
import { allTvshows, fetchTvShowsByGenre } from "../services/tmdbApi";
import { useNavigate, useLocation } from "react-router-dom";
import Banner from "../tvshows/Banner";
import GenreBar from "../tvshows/GenreBar";
import ImageWithLoader from "../ui/ImageWithLoader";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useAuth } from "../context/AuthContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faBookmark, faHeart, faTv } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useWishlist } from "../context/WishlistContext";

const TVShows = () => {
  const [tvShows, setTvShows] = useState([]);
  const [page, setPage] = useState(1);
  const [genre, setGenre] = useState("trending");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToHistory } = useWatchHistory();
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } =
    useWatchLater();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // -------------------- Fetch TV Shows --------------------
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setPage(1);

      try {
        const data =
          genre === "trending"
            ? await allTvshows(1)
            : await fetchTvShowsByGenre(genre, 1);

        if (active) {
          const results = data?.results || data || [];
          setTvShows(results);
          setHasMore(results.length >= 20);
        }
      } catch (err) {
        if (active) setError("Failed to load TV shows");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [genre]);

  const loadMoreShows = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data =
        genre === "trending"
          ? await allTvshows(nextPage)
          : await fetchTvShowsByGenre(genre, nextPage);
      
      const results = data?.results || data || [];
      setTvShows(prev => [...prev, ...results]);
      setPage(nextPage);
      setHasMore(results.length >= 20);
    } catch (err) {
      setError("Failed to load more TV shows");
    } finally {
      setLoadingMore(false);
    }
  };

  // -------------------- Handlers --------------------
  const handleGenreChange = (id) => {
    setGenre(id);
  };

  const handleShowClick = (show) => {
    if (!user) {
      navigate("/login", {
        state: {
          from: location.pathname,
          message: "Login required to view TV show details",
        },
      });
      return;
    }

    addToHistory({
      id: show.id,
      title: show.name || show.title,
      poster_path: show.poster_path,
      vote_average: show.vote_average,
      media_type: "tv",
    });

    navigate(`/tvshow/${show.id}`);
  };

  // -------------------- Render --------------------
  return (
    <section className="py-5 flex flex-col gap-6">
      {/* -------------------- Banner -------------------- */}
      <Banner />
      {/* -------------------- Genre Selection -------------------- */}
      <GenreBar setGenre={handleGenreChange} />
      {/* -------------------- Movies Grid -------------------- */}
      <h4 className="text-3xl px-4">TV Shows</h4>

      {loading && <p className="text-center text-gray-400">Loading TV shows...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!loading && !error && tvShows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FontAwesomeIcon icon={faTv} className="text-4xl mb-4" />
          <p>No TV shows found</p>
        </div>
      )}

      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 justify-items-center px-3 sm:px-4"
        role="list">
        {tvShows.map((show) => {
          if (!show.poster_path) return null;

          const isInWatchLaterFlag = isInWatchLater(show.id);

          return (
            <motion.div
              key={show.id}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 260 }}
              role="listitem">
              <button
                onClick={() => handleShowClick(show)}
                onKeyDown={(e) => e.key === "Enter" && handleShowClick(show)}
                tabIndex={0}
                className="relative group text-left cursor-pointer">
                <ImageWithLoader
                  src={`https://image.tmdb.org/t/p/w342${show.poster_path}`}
                  alt={show.name || show.title}
                  className="w-48 h-72 rounded shadow-md object-cover"
                />

                {user && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      isInWatchLaterFlag
                        ? removeFromWatchLater(show.id, "tv")
                        : addToWatchLater(show, "tv");
                    }}
                    className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded
                    opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <FontAwesomeIcon
                      icon={isInWatchLaterFlag ? faBookmark : faClock}
                      className="cursor-pointer"
                    />
                  </button>
                )}

                <span className="absolute bottom-10 left-2 bg-yellow-500 text-black font-bold text-sm px-3 py-1 rounded opacity-100 md:opacity-100 md:group-hover:opacity-100">
                  ★ {show.vote_average?.toFixed(1) ?? "N/A"}
                </span>

                {user && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    isInWishlist(show.id, "tv")
                      ? removeFromWishlist(show.id, "tv")
                      : addToWishlist({
                          id: show.id,
                          title: show.name,
                          poster_path: show.poster_path,
                          vote_average: show.vote_average,
                          media_type: "tv",
                        });
                  }}
                  className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                  <FontAwesomeIcon
                    icon={faHeart}
                    style={{ color: isInWishlist(show.id, "tv") ? "#FF0000" : "#FFFFFF" }}
                    className="cursor-pointer shadow"
                  />
                </button>
                )}

                <h5 className="mt-2 truncate w-full max-w-48 px-1 text-sm sm:text-base">
                  {show.name || show.original_name || show.title}
                </h5>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* -------------------- Load More -------------------- */}
      {hasMore && !loading && (
        <div className="flex justify-center py-4">
          <motion.button
            whileHover={{ scale: loadingMore ? 1 : 1.05 }}
            whileTap={{ scale: loadingMore ? 1 : 0.95 }}
            disabled={loadingMore}
            onClick={loadMoreShows}
            className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load More"}
          </motion.button>
        </div>
      )}
    </section>
  );
};

export default TVShows;