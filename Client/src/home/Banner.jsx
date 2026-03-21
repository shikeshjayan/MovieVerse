import { useEffect, useState, useCallback, useRef } from "react";
import { upcomingMovies } from "../services/tmdbApi";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Banner = ({ movies: propMovies }) => {
  const [upcomingMovieList, setUpcomingMovieList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fetchingRef = useRef(false);

  const fetchUpcoming = useCallback(async (pageNum, append = false) => {
    try {
      const data = await upcomingMovies(pageNum);
      if (append) {
        setUpcomingMovieList((prev) => [...prev, ...data.results]);
      } else {
        setUpcomingMovieList(data.results);
      }
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load movies");
    }
  }, []);

  useEffect(() => {
    if (propMovies && propMovies.length > 0) {
      setUpcomingMovieList(propMovies);
      setLoading(false);
      return;
    }
    fetchUpcoming(1).finally(() => setLoading(false));
  }, [propMovies, fetchUpcoming]);

  // Infinite scroll - fetch more when nearing the end
  useEffect(() => {
    if (loadingMore || page >= totalPages || fetchingRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetchingRef.current) {
          fetchingRef.current = true;
          setLoadingMore(true);
          const nextPage = page + 1;
          fetchUpcoming(nextPage, true)
            .then(() => setPage(nextPage))
            .finally(() => {
              setLoadingMore(false);
              fetchingRef.current = false;
            });
        }
      },
      { rootMargin: "200px" }
    );

    const sentinel = document.getElementById("banner-sentinel");
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, fetchUpcoming]);

  // Auto slide every 6 seconds
  useEffect(() => {
    if (upcomingMovieList.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === upcomingMovieList.length - 1 ? 0 : prev + 1
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [upcomingMovieList]);

  if (loading) {
    return (
      <section className="relative w-full min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh] overflow-hidden bg-gray-900 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
        <div className="absolute bottom-6 sm:bottom-10 left-4 sm:left-6 md:left-10 space-y-3 sm:space-y-4 max-w-xs sm:max-w-2xl md:max-w-3xl">
          <div className="h-6 sm:h-8 md:h-10 lg:h-12 bg-gray-700 rounded w-3/4" />
          <div className="h-4 sm:h-5 md:h-6 bg-gray-700 rounded w-1/4" />
          <div className="h-3 sm:h-4 bg-gray-700 rounded w-1/2 hidden sm:block" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative w-full min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh] overflow-hidden bg-gray-900 flex items-center justify-center p-4">
        <p className="text-gray-400 text-base sm:text-xl">{error}</p>
      </section>
    );
  }

  if (upcomingMovieList.length === 0) return null;

  const movie = upcomingMovieList[currentIndex];
  if (!movie || !movie.backdrop_path) return null;

  // Slide navigation
  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? upcomingMovieList.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === upcomingMovieList.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section className="relative w-full min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh] overflow-hidden">
      {/* Sentinel for infinite scroll */}
      <div id="banner-sentinel" className="absolute bottom-0 left-0 w-1 h-1" />
      
      {/* Loading more indicator */}
      {loadingMore && (
        <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 text-white text-xs sm:text-sm flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="hidden sm:inline">Loading more...</span>
        </div>
      )}
      
      {/* AnimatePresence ensures smooth fade-in/out on change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Movie backdrop image */}
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={movie.title}
            onError={(e) => {
              e.target.src = "/over.jpg";
            }}
            className="w-full h-full object-cover object-center"
          />

          {/* Gradient overlay */}
          <div
            className="absolute bottom-0 left-0 w-full h-1/2 sm:h-[60%] md:h-[50%]
          bg-gradient-to-t from-black/90 via-black/50 to-transparent"
          ></div>

          {/* Text content */}
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-10 left-3 sm:left-6 md:left-10 pr-8 sm:pr-12 max-w-xs sm:max-w-2xl md:max-w-3xl text-white">
            <motion.h2
              key={movie.id + "-title"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold line-clamp-2"
            >
              {movie.original_title || movie.title}
            </motion.h2>

            <motion.div
              key={movie.id + "-details"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base flex flex-wrap gap-2 sm:gap-4 items-center"
            >
              <span className="text-yellow-400 font-bold">
                {movie.vote_average.toFixed(1)} / 10
              </span>
              <span className="italic uppercase">{movie.original_language}</span>
            </motion.div>

            <motion.p
              key={movie.id + "-overview"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm md:text-base font-light max-w-xs sm:max-w-md md:max-w-xl line-clamp-2 sm:line-clamp-3 md:line-clamp-none"
            >
              {movie.overview}
            </motion.p>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={handlePrev}
            aria-label="Previous movie"
            className="absolute top-1/2 left-2 sm:left-4 -translate-y-1/2 text-white bg-black/50 p-1.5 sm:p-2 rounded-full hover:bg-black/70 transition touch-manipulation"
          >
            <FaChevronLeft size={16} className="sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next movie"
            className="absolute top-1/2 right-2 sm:right-4 -translate-y-1/2 text-white bg-black/50 p-1.5 sm:p-2 rounded-full hover:bg-black/70 transition touch-manipulation"
          >
            <FaChevronRight size={16} className="sm:w-6 sm:h-6" />
          </button>
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default Banner;
