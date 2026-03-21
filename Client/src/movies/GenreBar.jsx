import { useState, useRef, useEffect } from "react";

/**
 * GenreBar Component
 * --------------------------------------------------
 * Scrollable horizontal genre selector with active highlight.
 * Clicking a genre triggers `setGenre`.
 */
const GenreBar = ({ setGenre }) => {
  // Predefined list of genres
  const genres = [
    { name: "Trending", id: "trending" },
    { name: "Action", id: 28 },
    { name: "Comedy", id: 35 },
    { name: "Drama", id: 18 },
    { name: "Sci-Fi", id: 878 },
    { name: "Thriller/Horror", id: 27 },
  ];

  const [activeGenre, setActiveGenre] = useState("trending");
  const containerRef = useRef(null);

  // Scroll to active genre smoothly
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
      className="
        flex sm:justify-center gap-6 overflow-x-auto px-4 py-2
        bg-[#0064E0] min-h-16 items-center
        scrollbar-thin scrollbar-thumb-[#0073ff] scrollbar-track-[#004aa0]
        scroll-smooth
      "
    >
      {genres.map((genre) => (
        <span
          key={genre.id}
          onClick={() => handleClick(genre.id)}
          className={`
            cursor-pointer whitespace-nowrap px-4 py-2 rounded-full transition-all
            ${activeGenre === genre.id ? "bg-white text-[#0064E0] font-bold scale-110" : "text-[#ECF0FF] hover:scale-105"}
          `}
          title={`Select ${genre.name} genre`}
        >
          {genre.name}
        </span>
      ))}
    </div>
  );
};

export default GenreBar;
