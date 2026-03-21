import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSearch } from "../hooks/useSearch";
import ImageWithLoader from "../ui/ImageWithLoader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { motion } from "framer-motion";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { results, loading, error, totalResults } = useSearch({ maxPages: 5 });
  const { user } = useAuth();
  const { addToHistory } = useWatchHistory();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState("all");

  const handleItemClick = (item) => {
    if (!user) {
      navigate("/login", {
        state: { from: `/${item.media_type}/${item.id}` },
        replace: true,
      });
      return;
    }

    addToHistory({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      type: item.media_type,
    });

    navigate(`/${item.media_type}/${item.id}`);
  };

  const filteredResults = results.filter((item) => {
    if (filterType === "all") return true;
    return item.media_type === filterType;
  });

  useEffect(() => {
    if (!query) {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) setSearchParams({ q });
    }
  }, []);

  if (!query) {
    return (
      <div className="min-h-screen bg-black text-white pt-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold">Enter a search term</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            Search Results for "{query}"
          </h1>
          <span className="text-gray-400">
            {totalResults.toLocaleString()} results
          </span>
        </div>

        <div className="flex gap-2 mb-6">
          {["all", "movie", "tv", "person"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterType === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {type === "all" ? "All" : type === "movie" ? "Movies" : type === "tv" ? "TV Shows" : "People"}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-gray-800 rounded-lg"></div>
                <div className="h-4 bg-gray-800 rounded mt-2"></div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-8">{error}</div>
        )}

        {!loading && filteredResults.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No results found for your search.
          </div>
        )}

        {!loading && filteredResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {filteredResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                  {item.poster_path || item.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path || item.profile_path}`}
                      alt={item.title || item.name}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling?.classList.remove("hidden");
                      }}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gray-800 flex items-center justify-center ${item.poster_path || item.profile_path ? "hidden" : ""}`}>
                    <span className="text-gray-500">No Image</span>
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {item.title || item.name}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">
                    {item.media_type === "person" 
                      ? item.known_for?.map(k => k.title || k.name).slice(0, 2).join(", ") || "Unknown"
                      : (item.release_date || item.first_air_date)?.slice(0, 4) || "N/A"
                    }
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
