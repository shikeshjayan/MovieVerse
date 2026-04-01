/**
 * Recommendations Page
 * 
 * Personalized movie recommendations page powered by TensorFlow.js ML model.
 * Uses collaborative filtering based on user's watch history, watch later, and wishlist data.
 * Falls back to genre-based recommendations when insufficient ML data is available.
 */
/* eslint-disable no-unused-vars */
import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeProvider";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useWatchLater } from "../context/WatchLaterContext";
import useRecommendations from "../hooks/useRecommendations";
import BlurImage from "../ui/BlurImage";
import { AI_CONFIG } from "../config/ai.config";
import {
  faClock,
  faFilm,
  faStar,
  faDeleteLeft,
  faHeart,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useWishlist } from "../context/WishlistContext";

/** Number of movies to display per page in the grid */
const PAGE_SIZE = 12;

const Recommendations = () => {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const { addToHistory } = useWatchHistory();
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } =
    useWatchLater();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const navigate = useNavigate();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { movies, source, topGenres, loading, error } = useRecommendations();

  // Deduplicate movies by id
  const uniqueMovies = Array.from(
    new Map(movies.map((m) => [m.id, m])).values(),
  );

  const hasMore = visibleCount < uniqueMovies.length;
  const displayedMovies = uniqueMovies.slice(0, visibleCount);

  const handleMovieClick = (movie) => {
    if (!user) {
      navigate("/login", {
        state: { from: `/movie/${movie.id}` },
        replace: true,
      });
      return;
    }
    addToHistory({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      type: "movie",
    });
    navigate(`/movie/${movie.id}`);
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  // ── Skeleton ─────────────────────────────────────────────────
  if (loading) {
    const isDark = theme === "dark";
    return (
      <section className="py-5 px-4 flex flex-col gap-6 max-w-7xl mx-auto">
        <div
          className={`rounded-2xl p-4 md:p-6 shadow-lg border ${isDark ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gradient-to-br from-[#0064E0] to-[#00D4FF] flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faBolt} className="w-5 h-5 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 md:gap-3">
                <h4
                  className={`text-xl md:text-2xl lg:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {AI_CONFIG.name}
                </h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-600"}`}>
                  Loading...
                </span>
              </div>
              <div
                className={`h-4 w-48 md:w-64 rounded animate-pulse mt-2 ${isDark ? "bg-slate-700" : "bg-gray-200"}`}></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 justify-items-center">
          {Array(12)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="w-full max-w-[180px] flex flex-col gap-2">
                <div className="w-full aspect-[2/3] rounded shadow-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mx-auto w-3/4" />
              </div>
            ))}
        </div>
      </section>
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error) {
    const isDark = theme === "dark";
    return (
      <section className="py-5 px-4 flex flex-col gap-4 max-w-7xl mx-auto">
        <div
          className={`rounded-2xl p-4 md:p-6 shadow-lg border ${isDark ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3 md:gap-4">
            <img src="/ai.png" alt="" className="w-12 h-12 md:w-14 md:h-14 rounded-lg shrink-0" />
            <div>
              <h4
                className={`text-xl md:text-2xl lg:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {AI_CONFIG.name}
              </h4>
              <p
                className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                Unable to load recommendations
              </p>
            </div>
          </div>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
      </section>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────
  if (!movies.length) {
    const isDark = theme === "dark";
    return (
      <section className="py-5 px-4 flex flex-col gap-4 max-w-7xl mx-auto">
        <div
          className={`rounded-2xl p-4 md:p-6 shadow-lg border ${isDark ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3 md:gap-4">
            <img src="/ai.png" alt="" className="w-12 h-12 md:w-14 md:h-14 rounded-lg shrink-0" />
            <div>
              <h4
                className={`text-xl md:text-2xl lg:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {AI_CONFIG.name}
              </h4>
              <p
                className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                Your personal movie curator
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
            <FontAwesomeIcon icon={faFilm} className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
          </div>
          <p className="text-gray-400 text-base md:text-lg">
            Watch some movies to get personalized recommendations!
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Start exploring to get recommendations
          </p>
        </div>
      </section>
    );
  }

  // ── Main ──────────────────────────────────────────────────────
  const isDark = theme === "dark";
  return (
    <section className="py-5 px-4 flex flex-col gap-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-4 md:p-6 shadow-lg border ${isDark ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3 md:gap-4">
            <img src="/ai.png" alt="" className="w-12 h-12 md:w-14 md:h-14 rounded-lg shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h4
                  className={`text-xl md:text-2xl lg:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"} whitespace-nowrap`}>
                  {source === "genre-preferences" ? "Picked For You" : AI_CONFIG.name}
                </h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${isDark ? "bg-[#0064E0]/20 text-cyan-400" : "bg-cyan-100 text-cyan-700"}`}>
                  <FontAwesomeIcon icon={faBolt} className="w-3 h-3" />
                  {source === "genre-preferences" ? "Your Preferences" : AI_CONFIG.sourceLabels[source] || AI_CONFIG.tagline}
                </span>
              </div>
              <p
                className={`text-sm mt-1 line-clamp-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                {source === "genre-preferences" ? "Movies based on your favorite genres" : AI_CONFIG.description}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg w-fit ${isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-600"}`}>
            <FontAwesomeIcon icon={faFilm} />
            <span>{uniqueMovies.length} picks</span>
          </div>
        </div>
        <div
          className={`mt-4 pt-4 border-t flex flex-wrap gap-2 md:gap-4 text-xs ${isDark ? "border-slate-600 text-slate-400" : "border-gray-200 text-gray-500"}`}>
          {source === "genre-preferences" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0"></span>
                <span className="truncate">Based on your selected genres</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00D4FF] shrink-0"></span>
                <span className="truncate">Your genre preferences</span>
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0064E0] shrink-0"></span>
                <span className="truncate">Based on your watch history</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00D4FF] shrink-0"></span>
                <span className="truncate">Your genre preferences</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0064E0] shrink-0"></span>
                <span className="truncate">Similar users' choices</span>
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <h4
          className={`text-xl md:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
          Recommended For You
        </h4>
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
          Based on your viewing preferences
        </p>
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 justify-items-center"
        role="list"
        aria-label="Recommended movies">
        {displayedMovies.map((movie) => {
          if (!movie.poster_path) return null;
          const inWatchLater = isInWatchLater(movie.id);

          return (
            <motion.div
              key={movie.id}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 260 }}
              className="shrink-0 w-full max-w-[180px]"
              role="listitem"
              aria-label={`Movie: ${movie.title}`}>
              <Link to={`/movie/${movie.id}`} className="group block">
                <div className="relative">
                  <BlurImage
                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full aspect-[2/3] rounded shadow-md object-cover"
                  />

                  {movie.reason && (
                    <div className="absolute bottom-0 left-0 right-0 px-1 py-1.5 bg-gradient-to-t from-black/90 to-transparent rounded-b">
                      <p className="text-[10px] text-center text-cyan-400 font-medium truncate px-1">
                        {AI_CONFIG.avatar} {movie.reason}
                      </p>
                    </div>
                  )}

                  {user && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        inWatchLater
                          ? removeFromWatchLater(movie.id, "movie")
                          : addToWatchLater(
                              {
                                ...movie,
                                movieId: movie.id,
                              },
                              "movie",
                            );
                      }}
                      aria-label={
                        inWatchLater
                          ? `Remove ${movie.title} from watch later`
                          : `Add ${movie.title} to watch later`
                      }
                      className="absolute z-10 top-1.5 left-1.5 bg-black/80 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition sm:opacity-100 sm:group-hover:opacity-100">
                      <FontAwesomeIcon
                        icon={inWatchLater ? faDeleteLeft : faClock}
                        className="w-3 h-3 cursor-pointer shadow"
                      />
                    </button>
                  )}

                  {user && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        isInWishlist(movie.id, "movie")
                          ? removeFromWishlist(movie.id, "movie")
                          : addToWishlist({
                              id: movie.id,
                              title: movie.title,
                              poster_path: movie.poster_path,
                              vote_average: movie.vote_average,
                              type: "movie",
                            });
                      }}
                      className="absolute z-10 top-1.5 right-1.5 bg-black/80 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition sm:opacity-100 sm:group-hover:opacity-100">
                      <FontAwesomeIcon
                        icon={faHeart}
                        style={{
                          color: isInWishlist(movie.id, "movie")
                            ? "#FF0000"
                            : "#FFFFFF",
                        }}
                        className="w-3 h-3 cursor-pointer shadow"
                      />
                    </button>
                  )}

                  <span className="absolute bottom-1.5 left-1.5 bg-yellow-500 text-black font-bold text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition sm:opacity-100">
                    ★ {movie.vote_average?.toFixed(1) ?? "N/A"}
                  </span>
                </div>

                <h5 className="mt-2 text-center text-xs sm:text-sm truncate">
                  {movie.title}
                </h5>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="w-full flex justify-center py-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadMore}
            className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Load More
          </motion.button>
        </div>
      )}
    </section>
  );
};

export default Recommendations;
