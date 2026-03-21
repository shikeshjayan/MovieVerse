import { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeProvider";
import { motion } from "framer-motion";
/**
 * SearchResult Component
 * Renders a dropdown list of search results with keyboard navigation support.
 * Each item is clickable and navigates to the movie/TV show detail page.
 *
 * @param {Array} movies - List of movie/TV show objects from TMDB
 * @param {number} activeIndex - Index of the currently highlighted item
 * @param {Function} setActiveIndex - Function to update the active index
 * @param {Function} onClose - Function to close the search dropdown
 */
const SearchResult = ({ movies, activeIndex, setActiveIndex, onClose }) => {
  const navigate = useNavigate();
  const itemRefs = useRef([]);
  const { theme } = useContext(ThemeContext);

  // Scroll the active item into view when activeIndex changes
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex].scrollIntoView({
        block: "nearest",
      });
    }
  }, [activeIndex]);

  /**
   * Handles click on a search result item
   * @param {number} id - Movie/TV show ID
   * @param {string} type - Media type ("movie" or "tv")
   */
  const handleItemClick = (e, item) => {
    e.stopPropagation();
    if (item.media_type === "person") {
      navigate(`/search?q=${encodeURIComponent(item.name)}`);
    } else {
      const route =
        item.media_type === "tv" ? `/tvshow/${item.id}` : `/movie/${item.id}`;
      navigate(route);
    }
    if (onClose) onClose();
  };

  const renderPersonItem = (item, index) => {
    const knownFor =
      item.known_for
        ?.map((k) => k.title || k.name)
        .slice(0, 3)
        .join(", ") || "Unknown";
    return (
      <div
        key={item.id}
        ref={(el) => (itemRefs.current[index] = el)}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={(e) => handleItemClick(e, item)}
        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-gray-800 last:border-0 ${
          index === activeIndex ? "bg-blue-100/20" : "hover:bg-blue-500"
        }`}>
        <img
          src={
            item.profile_path
              ? `https://image.tmdb.org/t/p/w92${item.profile_path}`
              : "/avatar.png"
          }
          alt={item.name}
          onError={(e) => {
            e.target.src = "/avatar.png";
          }}
          className="w-11 h-16 object-cover rounded shadow-sm"
        />
        <div className="flex-1 text-left">
          <h4
            className={`text-sm font-semibold line-clamp-1 ${theme === "dark" ? "text-[#FAFAFA]" : "text-[#312F2C]"}`}>
            {item.name}
          </h4>
          <div
            className={`flex items-center gap-2 text-xs mt-1 ${
              theme === "dark" ? "text-[#FAFAFA]" : "text-[#312F2C]"
            }`}>
            <span className="uppercase px-1 rounded text-[10px] bg-blue-500/30 text-blue-400">
              Person
            </span>
            <span className="line-clamp-1">Known for: {knownFor}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderMediaItem = (item, index) => (
    <div
      key={item.id}
      ref={(el) => (itemRefs.current[index] = el)}
      onMouseEnter={() => setActiveIndex(index)}
      onClick={(e) => handleItemClick(e, item)}
      className={`
        flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-gray-800 last:border-0
        ${index === activeIndex ? "bg-blue-100/20" : "hover:bg-blue-500"}
      `}>
      <img
        src={
          item.poster_path
            ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
            : "/over.jpg"
        }
        alt={item.title || item.name}
        onError={(e) => {
          e.target.src = "/over.jpg";
        }}
        className="w-11 h-16 object-cover rounded shadow-sm"
      />

      <div className="flex-1 text-left">
        <h4
          className={`text-sm font-semibold line-clamp-1
            ${theme === "dark" ? "text-[#FAFAFA]" : "text-[#312F2C]"}
          `}>
          {item.title || item.name}
        </h4>
        <div
          className={`flex items-center gap-2 text-xs mt-1 ${
            theme === "dark" ? "text-[#FAFAFA]" : "text-[#312F2C]"
          }`}>
          <span
            className={`${
              theme === "dark" ? "text-[#FAFAFA]" : "text-[#312F2C]"
            }`}>
            {(item.release_date || item.first_air_date)?.substring(0, 4) ??
              "N/A"}
          </span>
          <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
          <span className="uppercase px-1 rounded text-[10px]">
            {item.media_type === "tv" ? "TV" : "Movie"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`absolute top-full mt-5 left-1/2 -translate-x-1/2
  w-full max-w-[95vw] sm:max-w-150
  backdrop-blur-lg rounded-b shadow-2xl
  max-h-80 overflow-y-auto z-50
        [&::-webkit-scrollbar-track]:bg-gray-100
[&::-webkit-scrollbar-thumb]:bg-gray-300
[&::-webkit-scrollbar-thumb]:hover:bg-gray-400
dark:[&::-webkit-scrollbar-track]:bg-gray-800
dark:[&::-webkit-scrollbar-thumb]:bg-[#0064E0]
dark:[&::-webkit-scrollbar-thumb]:hover:bg-[#0073ff]
        ${theme === "dark" ? "bg-black/70" : "bg-white/70"}
      `}>
      {movies && movies.length > 0 ? (
        movies.map((item, index) =>
          item.media_type === "person"
            ? renderPersonItem(item, index)
            : renderMediaItem(item, index),
        )
      ) : (
        <div className="p-4 text-center text-gray-500 text-sm">
          No results found
        </div>
      )}
    </motion.div>
  );
};

export default SearchResult;
