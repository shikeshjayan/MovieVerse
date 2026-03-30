import { useEffect, useState, useCallback, useRef } from "react";
import { nowPlayingMovies } from "../services/tmdbApi";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

/**
 * NowPlayingBanner
 * --------------------------------------------------
 * Displays a full-screen banner carousel for now-playing movies.
 * - Auto-sliding with interval
 * - Manual navigation with arrows
 * - Fade-in/out transitions with Framer Motion
 * - Responsive text overlay
 * - Infinite scroll for more movies
 */
const NowPlayingBanner = () => {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fetchingRef = useRef(false);

  // ---------------- Fetch now-playing movies ----------------
  const fetchNowPlaying = useCallback(async (pageNum, append = false) => {
    try {
      const data = await nowPlayingMovies(pageNum);
      if (append) {
        setMovies((prev) => [...prev, ...data.results]);
      } else {
        setMovies(data.results);
      }
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to load now playing movies:", err);
    }
  }, []);

  useEffect(() => {
    fetchNowPlaying(1).finally(() => setLoading(false));
  }, [fetchNowPlaying]);

  // Infinite scroll - fetch more when nearing the end
  useEffect(() => {
    if (loadingMore || page >= totalPages || fetchingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetchingRef.current) {
          fetchingRef.current = true;
          setLoadingMore(true);
          const nextPage = page + 1;
          fetchNowPlaying(nextPage, true)
            .then(() => setPage(nextPage))
            .finally(() => {
              setLoadingMore(false);
              fetchingRef.current = false;
            });
        }
      },
      { rootMargin: "200px" }
    );

    const sentinel = document.getElementById("movies-banner-sentinel");
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, fetchNowPlaying]);

  // ---------------- Auto slide every 6 seconds ----------------
  useEffect(() => {
    if (!movies.length) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(interval);
  }, [movies]);

  if (loading) {
    return (
      <section className="relative w-full h-[80vh] overflow-hidden bg-gray-900 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
        <div className="absolute bottom-10 left-6 space-y-4 max-w-3xl">
          <div className="h-12 bg-gray-700 rounded w-3/4" />
          <div className="h-6 bg-gray-700 rounded w-1/4" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
        </div>
      </section>
    );
  }

  if (!movies.length) return null;

  const movie = movies[currentIndex];
  if (!movie?.backdrop_path) return null;

  // ---------------- Manual navigation ----------------
  const handlePrev = () =>
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  const handleNext = () =>
    setCurrentIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));

  return (
    <section className="relative w-full h-[80vh] overflow-hidden">
      {/* Sentinel for infinite scroll */}
      <div id="movies-banner-sentinel" className="absolute bottom-0 left-0 w-1 h-1" />
      
      {/* Loading more indicator */}
      {loadingMore && (
        <div className="absolute bottom-4 right-4 text-white text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading more...
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Movie backdrop */}
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={movie.title}
            onError={(e) => {
              e.target.src = "/over.jpg";
            }}
            className="w-full h-full object-cover sm:aspect-square"
          />

          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 w-full h-[50%] bg-linear-to-t from-black/80 to-transparent" />

          {/* Text content */}
          <div className="absolute bottom-10 left-6 max-w-3xl text-white">
            {/* Title */}
            <motion.h2
              key={movie.id + "-title"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold"
            >
              {movie.original_title || movie.title}
            </motion.h2>

            {/* Rating & Language */}
            <motion.div
              key={movie.id + "-details"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-2 text-sm sm:text-base md:text-lg flex gap-4 items-center"
            >
              <span className="text-yellow-400 font-bold">
                {movie.vote_average.toFixed(1)} / 10
              </span>
              <span className="italic">{movie.original_language}</span>
            </motion.div>

            {/* Overview */}
            <motion.p
              key={movie.id + "-overview"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-4 text-sm sm:text-base md:text-lg font-light max-w-xl"
            >
              {movie.overview}
            </motion.p>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={handlePrev}
            aria-label="Previous movie"
            className="absolute top-1/2 left-4 -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
          >
            <FaChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next movie"
            className="absolute top-1/2 right-4 -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
          >
            <FaChevronRight size={24} />
          </button>
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default NowPlayingBanner;
