import { useState, useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { ThemeContext } from "../context/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../services/apiClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles,
  faMagnifyingGlass,
  faPaperPlane,
  faXmark,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import BlurImage from "../ui/BlurImage";
import { useVoiceSearch } from "../hooks/useVoiceSearch";

// ─────────────────────────────────────────────
// AI Smart Search Component (inline)
// ─────────────────────────────────────────────
const examplePrompts = [
  "I feel lonely tonight, suggest something comforting",
  "I need motivation, suggest inspiring movies",
  "Something scary but not too gory",
  "Feel-good movies for a rainy day",
  "Mind-bending movies that make you think",
];

const SmartSearch = ({ initialQuery = "" }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(!!initialQuery);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [initialSearchDone, setInitialSearchDone] = useState(!!initialQuery);

  const { isListening, isSupported, startListening, stopListening } = useVoiceSearch({
    onResult: (text) => setQuery(text),
    onFinalResult: (text) => {
      setQuery(text);
      handleSearch(text);
    },
  });

  useEffect(() => {
    if (initialQuery && !initialSearchDone) {
      setInitialSearchDone(true);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (q) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const { data } = await apiClient.post("/smart-search/ai", {
        query: searchQuery,
      });
      setResults(data.results || []);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setError(null);
  };

  return (
    <div className="w-full">
      {/* Input row */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder='e.g. "I lack motivation, suggest 10 movies for now"'
            className="w-full border border-purple-400 rounded-xl px-4 py-3 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-[#312F2C] placeholder-gray-400 dark:bg-gray-800 dark:text-white"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
            {isSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`transition-colors ${
                  isListening ? "text-red-500" : "text-gray-400 hover:text-purple-400"
                }`}
                aria-label={isListening ? "Stop listening" : "Start voice search"}>
                <FontAwesomeIcon icon={faMicrophone} />
              </button>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-5 py-3 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap">
          <FontAwesomeIcon icon={faPaperPlane} />
          {loading ? "Thinking..." : "Ask AI"}
        </motion.button>
      </div>

      {/* Example prompts — hide after first search */}
      {!searched && (
        <div className="flex flex-wrap gap-2 mb-6">
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setQuery(prompt);
                handleSearch(prompt);
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-purple-400 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition">
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-2" />
              <div className="h-3 bg-gray-700 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      {/* Results */}
      {!loading && results.length > 0 && (
        <AnimatePresence>
          <div className="mt-2">
            <p className="text-sm text-gray-400 mb-4">
              AI found{" "}
              <span className="font-semibold text-purple-400">
                {results.length} picks
              </span>{" "}
              for you
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((item, i) => (
                <motion.div
                  key={`${item.id}-${item.media_type}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() =>
                    navigate(
                      item.media_type === "tv"
                        ? `/tvshow/${item.id}`
                        : `/movie/${item.id}`,
                    )
                  }
                  className="cursor-pointer group">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                    <BlurImage
                      src={
                        item.poster_path
                          ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                          : "/over.jpg"
                      }
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Rating badge */}
                    <span className="absolute bottom-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded">
                      ★ {item.vote_average?.toFixed(1) ?? "N/A"}
                    </span>
                    {/* Type badge */}
                    <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.media_type === "tv" ? "TV" : "Movie"}
                    </span>
                    {/* Reason tooltip on hover */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                      <p className="text-white text-xs leading-tight line-clamp-4">
                        💡 {item.reason}
                      </p>
                    </div>
                  </div>
                  <h5 className="mt-2 text-xs text-center truncate font-medium">
                    {item.title}
                  </h5>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatePresence>
      )}

      {/* No results after search */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="text-center py-10 text-gray-400">
          <FontAwesomeIcon
            icon={faWandMagicSparkles}
            className="text-3xl mb-3"
          />
          <p>Couldn't find matches. Try rephrasing your request.</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Normal Search Component (inline)
// ─────────────────────────────────────────────
const NormalSearch = ({ initialQuery = "", onResults }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(!!initialQuery);
  const [filterType, setFilterType] = useState("all");
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToHistory } = useWatchHistory();
  const [initialSearchDone, setInitialSearchDone] = useState(!!initialQuery);

  const { isListening, isSupported, startListening, stopListening } = useVoiceSearch({
    onResult: (text) => setQuery(text),
    onFinalResult: (text) => {
      setQuery(text);
      handleSearch(text);
    },
  });

  useEffect(() => {
    if (initialQuery && !initialSearchDone) {
      setInitialSearchDone(true);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (q) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/search/multi?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setResults(data.results || []);
      if (onResults) onResults(data.results || []);
    } catch (err) {
      setError("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="w-full">
      {/* Search input */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search movies, TV shows, people..."
            className="w-full border border-gray-600 rounded-xl pl-10 pr-20 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-[#312F2C] placeholder-gray-400 dark:bg-gray-800 dark:text-white"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
                className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
            {isSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`transition-colors ${
                  isListening ? "text-red-500" : "text-gray-400 hover:text-blue-400"
                }`}
                aria-label={isListening ? "Stop listening" : "Start voice search"}>
                <FontAwesomeIcon icon={faMicrophone} />
              </button>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          {loading ? "Searching..." : "Search"}
        </motion.button>
      </div>

      {/* Filter tabs */}
      {searched && (
        <div className="flex gap-2 mb-6">
          {["all", "movie", "tv", "person"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterType === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}>
              {type === "all" ? "All" : type === "movie" ? "Movies" : type === "tv" ? "TV Shows" : "People"}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-gray-800 rounded-lg" />
              <div className="h-4 bg-gray-800 rounded mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <div className="text-red-500 text-center py-8">{error}</div>}

      {/* Empty state */}
      {!loading && searched && filteredResults.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-3xl mb-3" />
          <p>No results found for "{query}".</p>
        </div>
      )}

      {/* Not searched yet */}
      {!loading && !searched && (
        <div className="text-center py-20 text-gray-400">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-5xl mb-4 opacity-30" />
          <p className="text-lg">Start typing to search</p>
          <p className="text-sm mt-2">Find movies, TV shows, and people</p>
        </div>
      )}

      {/* Results grid */}
      {!loading && filteredResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredResults.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="cursor-pointer group">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                {item.poster_path || item.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path || item.profile_path}`}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {item.title || item.name}
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  {item.media_type === "person"
                    ? item.known_for?.map((k) => k.title || k.name).slice(0, 2).join(", ") || "Unknown"
                    : (item.release_date || item.first_air_date)?.slice(0, 4) || "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main SearchResults Page
// ─────────────────────────────────────────────
const SearchResults = () => {
  const { theme } = useContext(ThemeContext);
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchMode, setSearchMode] = useState("normal");

  return (
    <div
      className="min-h-screen pt-24 px-4 bg-white text-black dark:bg-black dark:text-white">
      <div className="max-w-6xl mx-auto">
        {/* ── Mode Toggle ── */}
        <div className="flex gap-2 mb-6 w-fit rounded-xl border border-gray-700 p-1">
          <button
            onClick={() => setSearchMode("normal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              searchMode === "normal"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-gray-800"
            }`}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            Normal Search
          </button>
          <button
            onClick={() => setSearchMode("ai")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              searchMode === "ai"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                : "text-gray-400 hover:bg-gray-800"
            }`}>
            <FontAwesomeIcon icon={faWandMagicSparkles} />
            AI Search
          </button>
        </div>

        {/* ── Search Panels ── */}
        <AnimatePresence mode="wait">
          {searchMode === "ai" && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}>
              {/* AI header */}
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon
                  icon={faWandMagicSparkles}
                  className="text-purple-400 text-xl"
                />
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  AI Smart Search
                </h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Describe your mood or what you're looking for — AI will find the
                perfect movies for you.
              </p>
              <SmartSearch initialQuery={initialQuery} />
            </motion.div>
          )}

          {searchMode === "normal" && (
            <motion.div
              key="normal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-blue-400" />
                Search
              </h2>
              <NormalSearch initialQuery={initialQuery} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchResults;
