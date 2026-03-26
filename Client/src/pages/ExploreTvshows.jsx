import { useEffect, useState, useCallback } from "react";
import { fetchMoviesWithPagination } from "../services/tmdbApi";
import MediaCard from "../ui/MediaCard";
import MediaSkeleton from "../ui/MediaSkeleton";

const GENRES = [
  { id: 10759, name: "Action & Adventure" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 16, name: "Animation" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 9648, name: "Mystery" },
  { id: 80, name: "Crime" },
  { id: 37, name: "Western" },
  { id: 99, name: "Documentary" },
  { id: 10766, name: "Soap Opera" },
  { id: 10767, name: "Talk Show" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
];

const ExploreTvshows = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    year: "",
    genre: "",
  });

  const fetchShows = useCallback(
    async (pageNum, append = false, searchQuery = "", filterParams = {}) => {
      try {
        let data;
        if (searchQuery) {
          data = await fetchMoviesWithPagination("/tv/search", {
            query: searchQuery,
            page: pageNum,
          });
        } else {
          data = await fetchMoviesWithPagination("/tv/discover", {
            page: pageNum,
            sort_by: "popularity.desc",
            ...filterParams,
          });
        }
        
        if (append) {
          setShows((prev) => [...prev, ...data.results]);
        } else {
          setShows(data.results || []);
        }
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Failed to load TV shows:", error);
      }
    },
    []
  );

  useEffect(() => {
    setLoading(true);
    const filterParams = {};
    if (filters.year) filterParams.first_air_date_year = filters.year;
    if (filters.genre) filterParams.with_genres = filters.genre;

    fetchShows(1, false, search, filterParams).finally(() => setLoading(false));
  }, [search, filters, fetchShows]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const filterParams = {};
    if (filters.year) filterParams.first_air_date_year = filters.year;
    if (filters.genre) filterParams.with_genres = filters.genre;

    await fetchShows(nextPage, true, search, filterParams);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleClear = () => {
    setFilters({ year: "", genre: "" });
    setSearch("");
    setPage(1);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i);

    return (
      <section className="py-5 px-6 min-h-screen">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">
          Explore All TV Shows
        </h1>

        <div className="mb-6 px-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
            type="text"
            placeholder="Search TV shows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-red-500"
          />

          <select
            value={filters.year}
            onChange={(e) => handleFilterChange("year", e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-red-500 text-sm"
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={filters.genre}
            onChange={(e) => handleFilterChange("genre", e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-red-500 text-sm"
          >
            <option value="">Genre</option>
            {GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleClear}
            className="px-3 py-2 text-sm text-red-500 hover:text-red-400"
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 justify-items-center px-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <MediaSkeleton key={i} />
          ))}
        </div>
      ) : shows.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No TV shows found</p>
       ) : (
         <>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 justify-items-center px-4">
             {shows.map((show) => (
               <MediaCard key={show.id} item={show} type="tv" />
             ))}
           </div>

           {page < totalPages && (
             <div className="flex justify-center mt-8">
               <button
                 onClick={handleLoadMore}
                 disabled={loadingMore}
                 className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-300"
               >
                 {loadingMore ? "Loading..." : "Load More"}
               </button>
             </div>
           )}
         </>
       )}
     </section>
  );
};

export default ExploreTvshows;
