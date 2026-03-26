import { useEffect, useRef } from "react";
import MediaSkeleton from "../ui/MediaSkeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeProvider";

/**
 * UniversalCarousel Component
 * ---------------------------
 * A reusable horizontal carousel for any type of media (movies, shows, etc.).
 *
 * Features:
 * - Displays a title above the carousel
 * - Shows skeleton loaders while data is loading
 * - Renders items using a custom `renderItem` function
 * - Auto-scrolls horizontally when enabled
 * - Pauses auto-scroll on hover
 * - Smooth scroll behavior with hidden scrollbar
 * - Infinite scroll support with load more functionality
 *
 * Props:
 * - `title` (string): Optional title displayed above the carousel
 * - `items` (array): Array of items to display (e.g., movies, shows)
 * - `loading` (boolean): If true, shows skeleton loaders instead of items
 * - `error` (string): Error message to display
 * - `renderItem` (function): Function that takes an item and returns a JSX element
 * - `skeletonCount` (number): Number of skeleton items to show when loading (default: 8)
 * - `autoScroll` (boolean): Whether to auto-scroll the carousel (default: true)
 * - `scrollSpeed` (number): Delay in ms between scroll steps (lower = faster)
 * - `hasMore` (boolean): Whether there are more items to load
 * - `onLoadMore` (function): Callback when user scrolls near the end to load more items
 * - `loadingMore` (boolean): Whether more items are being loaded
 */
const UniversalCarousel = ({
  title,
  items = [],
  loading = false,
  error = null,
  renderItem,
  skeletonCount = 8,
  autoScroll = true,
  scrollSpeed = 30,
  hasMore = false,
  onLoadMore = null,
  loadingMore = false,
}) => {
  const { theme } = useContext(ThemeContext);
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);
  const observerRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  /* ------------------------- Auto Scroll Logic ------------------------- */
  // Effect to handle auto-scrolling behavior
  useEffect(() => {
    // If auto-scroll is disabled or we're in loading state, do nothing
    if (!autoScroll || loading) return;

    // Get the scrollable container from the ref
    const container = scrollRef.current;
    if (!container) return;

    // Function to start auto-scrolling
    const start = () => {
      // Set an interval that moves the scroll position by 1px every `scrollSpeed` ms
      intervalRef.current = setInterval(() => {
        container.scrollLeft += 1;
      }, scrollSpeed);
    };

    // Function to stop auto-scrolling
    const stop = () => {
      // Clear the interval and reset the ref
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };

    // Start auto-scrolling when the effect runs
    start();

    // Pause auto-scroll when mouse enters the carousel
    container.addEventListener("mouseenter", stop);
    // Resume auto-scroll when mouse leaves the carousel
    container.addEventListener("mouseleave", start);

    // Cleanup: clear interval and remove event listeners on unmount
    return () => {
      stop();
      container.removeEventListener("mouseenter", stop);
      container.removeEventListener("mouseleave", start);
    };
  }, [autoScroll, loading, scrollSpeed]); // Re-run effect when these values change

  /* ------------------------- Infinite Scroll Logic ------------------------- */
  useEffect(() => {
    if (!hasMore || !onLoadMore || loadingMore) return;

    const container = scrollRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          onLoadMore();
        }
      },
      { root: container, threshold: 0.1 }
    );

    const sentinel = container.querySelector(".scroll-sentinel");
    if (sentinel) {
      observerRef.current.observe(sentinel);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, onLoadMore, loadingMore, loading]);

  // If there are no items and we're not loading, render nothing
  if (!items.length && !loading && !error) return null;

  // Show error state
  if (error) {
    return (
      <section className="flex flex-col gap-4 relative group">
        {title && (
          <h4 className="my-2 pl-4 md:text-3xl font-semibold">{title}</h4>
        )}
        <div className="flex items-center justify-center py-8 px-4">
          <p className="text-gray-400">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 sm:gap-4 relative group">
      {/* Optional title */}
      {title && (
        <h4 className="my-1 sm:my-2 pl-3 sm:pl-4 md:text-3xl font-semibold text-base sm:text-lg md:text-2xl lg:text-3xl">{title}</h4>
      )}

      {/* Navigation Arrows */}
      {!loading && items.length > 0 && (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full shadow-lg bg-white text-[#312F2C] hover:bg-gray-100 dark:bg-[#312F2C] dark:text-[#ECF0FF] dark:hover:bg-[#3d3a37]"
            aria-label="Scroll left">
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full shadow-lg bg-white text-[#312F2C] hover:bg-gray-100 dark:bg-[#312F2C] dark:text-[#ECF0FF] dark:hover:bg-[#3d3a37]"
            aria-label="Scroll right">
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 px-3 sm:px-4 scroll-smooth
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {/* Skeleton loaders shown while loading */}
        {loading &&
          Array.from({ length: skeletonCount }).map((_, i) => (
            <MediaSkeleton key={i} />
          ))}

        {/* Render actual items when not loading */}
        {!loading && items.map(renderItem)}

        {/* Sentinel element for infinite scroll */}
        <div className="scroll-sentinel flex-shrink-0 w-1" />

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center w-24 sm:w-32 flex-shrink-0">
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin text-xl sm:text-2xl text-gray-400"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default UniversalCarousel;
