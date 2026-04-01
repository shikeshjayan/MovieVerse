/**
 * Generic Banner Component
 * 
 * Reusable hero banner with slideshow, navigation controls, and touch support.
 * Accepts a fetch function to load content dynamically.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const swipeThreshold = 50;
const swipeVelocityThreshold = 0.3;

/**
 * @param {function} fetchFn - Async function to fetch banner items
 * @param {string} [mediaType="movie"] - Type of media
 * @param {string} [sentinelId] - ID for infinite scroll sentinel
 * @param {function} [getTitle] - Function to extract title from item
 * @param {function} [getOriginalTitle] - Function to extract original title
 */
const Banner = ({ 
  fetchFn, 
  mediaType = "movie", 
  sentinelId = "banner-sentinel",
  getTitle = (item) => item.title || item.name,
  getOriginalTitle = (item) => item.original_title || item.name
}) => {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [touchStart, setTouchStart] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const fetchingRef = useRef(false);
  const containerRef = useRef(null);

  const fetchData = useCallback(async (pageNum, append = false) => {
    try {
      const data = await fetchFn(pageNum);
      if (append) {
        setItems((prev) => [...prev, ...data.results]);
      } else {
        setItems(data.results);
      }
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to load banner data:", err);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData(1).finally(() => setLoading(false));
  }, [fetchData]);

  useEffect(() => {
    if (loadingMore || page >= totalPages || fetchingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetchingRef.current) {
          fetchingRef.current = true;
          setLoadingMore(true);
          const nextPage = page + 1;
          fetchData(nextPage, true)
            .then(() => setPage(nextPage))
            .finally(() => {
              setLoadingMore(false);
              fetchingRef.current = false;
            });
        }
      },
      { rootMargin: "200px" }
    );

    const sentinel = document.getElementById(sentinelId);
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, fetchData, sentinelId]);

  useEffect(() => {
    if (!items.length || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(interval);
  }, [items, isPaused]);

  const handleTouchStart = (e) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setIsPaused(true);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStart.x;
    
    if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaX) / 200 > swipeVelocityThreshold) {
      if (deltaX > 0) {
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
      } else {
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
      }
    }
    setTouchStart(null);
    setTimeout(() => setIsPaused(false), 3000);
  };

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

  if (!items.length) return null;

  const item = items[currentIndex];
  if (!item?.backdrop_path) return null;

  const handlePrev = () =>
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  const handleNext = () =>
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));

  return (
    <section 
      className="relative w-full h-[80vh] overflow-hidden"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div id={sentinelId} className="absolute bottom-0 left-0 w-1 h-1" />
      
      {loadingMore && (
        <div className="absolute bottom-4 right-4 text-white text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading more...
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          {item.backdrop_path ? (
            <img
              src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
              alt={getTitle(item)}
              className="w-full h-full object-cover sm:aspect-square"
              onError={(e) => { e.target.src = "/banner_placeholder.svg"; }}
            />
          ) : (
            <img
              src="/banner_placeholder.svg"
              alt={getTitle(item)}
              className="w-full h-full object-cover sm:aspect-square"
            />
          )}

          <div className="absolute bottom-0 left-0 w-full h-[50%] bg-linear-to-t from-black/80 to-transparent" />

          <div className="absolute bottom-10 left-6 max-w-3xl text-white">
            <motion.h2
              key={item.id + "-title"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold"
            >
              {getOriginalTitle(item)}
            </motion.h2>

            <motion.div
              key={item.id + "-details"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-2 text-sm sm:text-base md:text-lg flex gap-4 items-center"
            >
              <span className="text-yellow-400 font-bold">
                {item.vote_average.toFixed(1)} / 10
              </span>
              <span className="italic">{item.original_language}</span>
            </motion.div>

            <motion.p
              key={item.id + "-overview"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-4 text-sm sm:text-base md:text-lg font-light max-w-xl"
            >
              {item.overview}
            </motion.p>
          </div>

          <button
            onClick={handlePrev}
            aria-label="Previous"
            className="absolute top-1/2 left-4 -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
          >
            <FaChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next"
            className="absolute top-1/2 right-4 -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
          >
            <FaChevronRight size={24} />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {items.slice(0, 10).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: idx === currentIndex ? "#ffffff" : "rgba(255,255,255,0.4)",
                  transform: idx === currentIndex ? "scale(1.2)" : "scale(1)"
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default Banner;
