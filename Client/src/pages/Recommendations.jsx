// src/pages/Recommendations.jsx
/* eslint-disable no-unused-vars */
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeProvider";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useWatchLater } from "../context/WatchLaterContext";
import useRecommendations from "../hooks/useRecommendations";
import ImageWithLoader from "../ui/ImageWithLoader";
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

const PAGE_SIZE = 12; // movies per page

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
      <section className="py-5 flex flex-col gap-6">
        <div
          className={`mx-4 rounded-2xl p-6 shadow-lg border ${isDark ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0064E0] to-[#00D4FF] flex items-center justify-center">
              <FontAwesomeIcon icon={faBolt} className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4
                  className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Cortex AI
                </h4>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-600"}`}>
                  Loading...
                </span>
              </div>
              <div
                className={`h-4 w-64 rounded animate-pulse mt-2 ${isDark ? "bg-slate-700" : "bg-gray-200"}`}></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 justify-items-center px-4">
          {Array(12)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="w-50 flex flex-col gap-2">
                <div className="w-50 h-75 rounded shadow-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mx-2" />
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
      <section className="py-5 px-4 flex flex-col gap-4">
        <div
          className={`mx-4 rounded-2xl p-6 shadow-lg border ${isDark ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0064E0] to-[#00D4FF] flex items-center justify-center">
              <FontAwesomeIcon icon={faBolt} className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4
                className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Cortex AI
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
      <section className="py-5 px-4 flex flex-col gap-4">
        <div
          className={`mx-4 rounded-2xl p-6 shadow-lg border ${isDark ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0064E0] to-[#00D4FF] flex items-center justify-center">
              <FontAwesomeIcon icon={faBolt} className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4
                className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Cortex AI
              </h4>
              <p
                className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                Your personal movie curator
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
            <FontAwesomeIcon icon={faFilm} className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400 text-lg">
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
    <section className="py-5 flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mx-4 rounded-2xl p-6 shadow-lg border ${isDark ? "bg-[#1E293B] border-slate-700" : "bg-white border-gray-200"}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#94a5b9] to-[#ffffff] flex items-center justify-center shadow-lg shadow-[#0064E0]/30">
              <img src="ai.png" alt="" className="w-8 h-8 text-white" />
            </div>
              <div>
              <div className="flex items-center gap-3">
                <h4
                  className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {source === "genre-preferences" ? "Picked For You" : "Cortex AI"}
                </h4>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${isDark ? "bg-[#0064E0]/20 text-cyan-400" : "bg-cyan-100 text-cyan-700"}`}>
                  <FontAwesomeIcon icon={faBolt} className="w-3 h-3" />
                  {source === "genre-preferences" ? "Your Preferences" : source?.startsWith("ml") ? "AI-Powered" : "Smart Picks"}
                </span>
              </div>
              <p
                className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                {source === "genre-preferences" ? "Movies based on your favorite genres" : "Your personal movie curator"}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-600"}`}>
            <FontAwesomeIcon icon={faFilm} />
            <span>{uniqueMovies.length} picks for you</span>
          </div>
        </div>
        <div
          className={`mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs ${isDark ? "border-slate-600 text-slate-400" : "border-gray-200 text-gray-500"}`}>
          {source === "genre-preferences" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                Based on your selected genres
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00D4FF]"></span>
                Your genre preferences
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0064E0]"></span>
                Based on your watch history
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00D4FF]"></span>
                Your genre preferences
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0064E0]"></span>
                Similar users' choices
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Section Title */}
      <div className="flex items-center gap-3 px-4">
        <h4
          className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
          Recommended For You
        </h4>
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
          Based on your viewing preferences
        </p>
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 justify-items-center px-4"
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
              className="shrink-0"
              role="listitem"
              aria-label={`Movie: ${movie.title}`}>
              <div
                onClick={() => handleMovieClick(movie)}
                onKeyDown={(e) => e.key === "Enter" && handleMovieClick(movie)}
                tabIndex={0}
                role="button"
                className="relative group cursor-pointer">
                {/* Poster */}
                <ImageWithLoader
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                  alt={movie.title}
                  className="w-50 h-75 rounded shadow-md object-cover"
                  onError={(e) => {
                    e.target.src = "/Loader.svg";
                  }}
                />

                {/* Reason overlay on poster */}
                {movie.reason && (
                  <div className="absolute top-10 left-0 right-0 px-2 py-1 bg-black/70 backdrop-blur-sm">
                    <p className="text-xs text-center text-cyan-400 truncate">
                      {movie.reason}
                    </p>
                  </div>
                )}

                {/* Watch Later */}
                {user && (
                  <button
                    onClick={(e) => {
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
                    className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-sm
                      opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 ease-in-out cursor-pointer">
                    {inWatchLater ? (
                      <FontAwesomeIcon icon={faDeleteLeft} />
                    ) : (
                      <FontAwesomeIcon icon={faClock} />
                    )}
                  </button>
                )}

                {/* Wishlist */}
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
                    className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                    <FontAwesomeIcon
                      icon={faHeart}
                      style={{
                        color: isInWishlist(movie.id, "movie")
                          ? "#FF0000"
                          : "#FFFFFF",
                      }}
                      className="cursor-pointer shadow"
                    />
                  </button>
                )}

                {/* Rating */}
                <span
                  className="absolute bottom-10 left-2 bg-yellow-500 text-black font-bold text-sm px-3 py-1 rounded
                    opacity-100 md:opacity-100 md:group-hover:opacity-100 transition-opacity duration-300">
                  ★ {movie.vote_average?.toFixed(1) ?? "N/A"}
                </span>

                {/* Title */}
                <h5 className="w-50 px-2 text-center mt-2 truncate">
                  {movie.title}
                </h5>
              </div>
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
