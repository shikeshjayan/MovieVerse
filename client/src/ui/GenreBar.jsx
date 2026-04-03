/**
 * GenreBar Component
 * 
 * Horizontal scrollable genre selection bar with active state highlighting.
 * Auto-scrolls to center the selected genre for better UX.
 */
import { useState, useRef, useEffect } from "react";

/**
 * @param {Array<{id: number, name: string}>} genres - List of genre options
 * @param {function} setGenre - Callback when genre is selected
 * @param {string|number} defaultGenre - Initially selected genre
 */
const GenreBar = ({ genres = [], setGenre, defaultGenre = "trending" }) => {
  const [activeGenre, setActiveGenre] = useState(defaultGenre);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeElement = container.querySelector(".active");
    if (activeElement) {
      const offsetLeft = activeElement.offsetLeft - container.offsetLeft;
      container.scrollTo({
        left: offsetLeft - container.clientWidth / 2 + activeElement.clientWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeGenre]);

  const handleClick = (id) => {
    setActiveGenre(id);
    setGenre(id);
  };

  return (
    <div
      ref={containerRef}
      className="flex sm:justify-center gap-6 overflow-x-auto px-4 py-2 bg-[#0064E0] min-h-16 items-center scrollbar-thin scrollbar-thumb-[#0073ff] scrollbar-track-[#004aa0] scroll-smooth"
      role="tablist"
      aria-label="Genre selection"
    >
      {genres.map((genre) => (
        <span
          key={genre.id}
          onClick={() => handleClick(genre.id)}
          className={`cursor-pointer whitespace-nowrap px-4 py-2 rounded-full transition-all ${
            activeGenre === genre.id
              ? "bg-white text-[#0064E0] font-bold scale-110 active"
              : "text-[#ECF0FF] hover:scale-105"
          }`}
          title={`Select ${genre.name} genre`}
          role="tab"
          aria-selected={activeGenre === genre.id}
          aria-label={`Select ${genre.name}`}
        >
          {genre.name}
        </span>
      ))}
    </div>
  );
};

export default GenreBar;
