import { useEffect, useState, useCallback } from "react";
import { fetchMoviesWithPagination } from "../services/tmdbApi";
import MediaCard from "../ui/MediaCard";
import MediaSkeleton from "../ui/MediaSkeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilm, faTv, faGlobe, faFilter, faSort, faXmark } from "@fortawesome/free-solid-svg-icons";

const GENRES = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 27, name: "Horror" },
  { id: 878, name: "Sci-Fi" },
  { id: 18, name: "Drama" },
  { id: 10749, name: "Romance" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 14, name: "Fantasy" },
  { id: 9648, name: "Mystery" },
  { id: 53, name: "Thriller" },
  { id: 10759, name: "Action & Adventure" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap Opera" },
  { id: 10764, name: "Reality" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "hi", name: "Hindi" },
  { code: "zh", name: "Chinese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
];

const RATINGS = [
  { value: "8", label: "8+ Excellent" },
  { value: "7", label: "7+ Great" },
  { value: "6", label: "6+ Good" },
  { value: "5", label: "5+ Average" },
  { value: "4", label: "4+ Below Average" },
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularity" },
  { value: "release_date.desc", label: "Newest" },
  { value: "vote_average.desc", label: "Top Rated" },
  { value: "vote_count.desc", label: "Most Voted" },
];

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const ExploreAll = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moviePage, setMoviePage] = useState(1);
  const [tvPage, setTvPage] = useState(1);
  const [movieTotalPages, setMovieTotalPages] = useState(1);
  const [tvTotalPages, setTvTotalPages] = useState(1);
  const [type, setType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    year: "",
    genre: "",
    rating: "",
    language: "",
    sortBy: "popularity.desc",
  });

  const fetchItems = useCallback(
    async (moviePageNum, tvPageNum, append = false) => {
      try {
        const filterParams = {
          sort_by: filters.sortBy,
        };
        if (filters.year) {
          filterParams.primary_release_year = filters.year;
          filterParams.first_air_date_year = filters.year;
        }
        if (filters.genre) filterParams.with_genres = filters.genre;
        if (filters.language) filterParams.with_original_language = filters.language;
        if (filters.rating) filterParams.vote_average_gte = parseFloat(filters.rating);

        const fetchMovies = fetchMoviesWithPagination("/movies/discover", {
          page: moviePageNum,
          ...filterParams,
        });

        const fetchTV = fetchMoviesWithPagination("/tv/discover", {
          page: tvPageNum,
          ...filterParams,
        });

        const [moviesData, tvData] = await Promise.all([fetchMovies, fetchTV]);

        setMovieTotalPages(moviesData.totalPages);
        setTvTotalPages(tvData.totalPages);

        const moviesWithType = (moviesData.results || []).map((item) => ({
          ...item,
          media_type: "movie",
        }));
        const tvWithType = (tvData.results || []).map((item) => ({
          ...item,
          media_type: "tv",
        }));

        let newItems;
        if (type === "all") {
          newItems = shuffleArray([...moviesWithType, ...tvWithType]);
        } else if (type === "movie") {
          newItems = moviesWithType;
        } else {
          newItems = tvWithType;
        }

        if (append) {
          setItems((prev) => shuffleArray([...prev, ...newItems]));
        } else {
          setItems(newItems);
        }
      } catch (error) {
        console.error("Failed to load items:", error);
      }
    },
    [filters, type]
  );

  useEffect(() => {
    setLoading(true);
    fetchItems(1, 1, false).finally(() => setLoading(false));
  }, [filters, type]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setMoviePage(1);
    setTvPage(1);
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setMoviePage(1);
    setTvPage(1);
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;

    const movieHasMore = moviePage < movieTotalPages;
    const tvHasMore = tvPage < tvTotalPages;

    if (!movieHasMore && !tvHasMore) return;

    setLoadingMore(true);

    const nextMoviePage = movieHasMore ? moviePage + 1 : moviePage;
    const nextTvPage = tvHasMore ? tvPage + 1 : tvPage;

    await fetchItems(nextMoviePage, nextTvPage, true);
    setMoviePage(nextMoviePage);
    setTvPage(nextTvPage);
    setLoadingMore(false);
  };

  const handleClear = () => {
    setFilters({
      year: "",
      genre: "",
      rating: "",
      language: "",
      sortBy: "popularity.desc",
    });
    setType("all");
    setMoviePage(1);
    setTvPage(1);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i);

  const hasActiveFilters = filters.year || filters.genre || filters.rating || filters.language || filters.sortBy !== "popularity.desc";

    return (
      <section className="py-5 px-6 min-h-screen">
        <div className="max-w- mx-auto">
         <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">
           Explore All Movies & TV Shows
         </h1>
         <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => handleTypeChange("all")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  type === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={faFilter} />
                All
              </button>
              <button
                onClick={() => handleTypeChange("movie")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  type === "movie"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={faFilm} />
                Movies
              </button>
              <button
                onClick={() => handleTypeChange("tv")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  type === "tv"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={faTv} />
                TV Shows
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all border ${
                showFilters || hasActiveFilters
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <FontAwesomeIcon icon={faFilter} />
              Filters
              {hasActiveFilters && (
                <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {[filters.year, filters.genre, filters.rating, filters.language].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 space-y-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilter} />
                  Filter Options
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClear}
                    className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange("year", e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Genre
                  </label>
                  <select
                    value={filters.genre}
                    onChange={(e) => handleFilterChange("genre", e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Genres</option>
                    {GENRES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange("rating", e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Any Rating</option>
                    {RATINGS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                  <FontAwesomeIcon icon={faGlobe} />
                  Language
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFilterChange("language", "")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filters.language === ""
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    All
                  </button>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleFilterChange("language", lang.code)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filters.language === lang.code
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 justify-items-center px-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <MediaSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No results found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Showing {items.length} results
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 justify-items-center px-4">
              {items.map((item, index) => (
                <MediaCard
                  key={`${item.id}-${item.media_type}-${index}`}
                  item={item}
                  type={item.media_type}
                />
              ))}
            </div>

            {(moviePage < movieTotalPages || tvPage < tvTotalPages) && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-full transition-colors duration-300"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ExploreAll;
