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
import { SEARCH_CONFIG } from "../config/search.config";

const SmartSearch = ({ initialQuery = "" }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(!!initialQuery);
  const navigate = useNavigate();
  const [initialSearchDone, setInitialSearchDone] = useState(!!initialQuery);

  const { isListening, isSupported, error: voiceError, startListening, stopListening } = useVoiceSearch({
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
      <div className="flex gap-2 mb-4">
        <div className={`relative flex-1 rounded-xl border-2 px-4 py-3 transition-all ${
          loading 
            ? "border-purple-400 bg-purple-50 dark:bg-purple-950/30" 
            : "border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800"
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-purple-500 text-lg">{SEARCH_CONFIG.avatar}</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={SEARCH_CONFIG.description}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
              disabled={loading}
            />
            <div className="flex items-center gap-2">
              {query && !loading && (
                <button onClick={handleClear} className="text-gray-400 hover:text-gray-600">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
              {isSupported && !loading && (
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
              <span className="text-[10px] text-purple-400 whitespace-nowrap hidden sm:block">
                {SEARCH_CONFIG.labels.poweredBy}
              </span>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={!loading && query.trim() ? { scale: 1.05 } : {}}
          whileTap={!loading && query.trim() ? { scale: 0.95 } : {}}
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className={`relative overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 text-white px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
            loading || !query.trim() 
              ? "opacity-60 cursor-not-allowed" 
              : "opacity-100 cursor-pointer shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
          }`}>
          <FontAwesomeIcon 
            icon={faPaperPlane} 
          />
          <span className={loading ? "animate-pulse" : ""}>
            {loading ? "Thinking..." : "Ask AI"}
          </span>
        </motion.button>
      </div>

      {!searched && (
        <div className="flex flex-wrap gap-2 mb-6">
          {SEARCH_CONFIG.exampleQueries.slice(0, 4).map((prompt) => (
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

      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-4"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-purple-500 rounded-full blur-xl"
            />
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                />
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              {SEARCH_CONFIG.avatar} {SEARCH_CONFIG.labels.thinkingLabel}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Understanding your request...
            </p>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">{SEARCH_CONFIG.labels.errorLabel}: {error}</p>
          <p className="text-gray-400 text-xs mt-2">Try rephrasing your request or switching to regular search.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <AnimatePresence>
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                {SEARCH_CONFIG.avatar} {SEARCH_CONFIG.fullName}
              </span>
              <span className="text-xs text-gray-400">
                {SEARCH_CONFIG.labels.poweredBy}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {SEARCH_CONFIG.labels.resultLabel} "{query}"
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
                    {item.poster_path ? (
                      <BlurImage
                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src="/placeholder.svg"
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.target.src = "/placeholder.svg"; }}
                      />
                    )}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-purple-600 text-white rounded-full text-[10px] font-bold shadow">
                      {SEARCH_CONFIG.avatar} {SEARCH_CONFIG.labels.aiBadge}
                    </div>
                    <span className="absolute bottom-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded">
                      ★ {item.vote_average?.toFixed(1) ?? "N/A"}
                    </span>
                    <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${
                      item.media_type === "tv"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"
                    }`}>
                      {item.media_type === "tv" ? "TV Show" : "Movie"}
                    </span>
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

      {!loading && searched && results.length === 0 && !error && (
        <div className="text-center py-10 text-gray-400">
          <FontAwesomeIcon icon={faWandMagicSparkles} className="text-3xl mb-3" />
          <p>{SEARCH_CONFIG.labels.emptyLabel}.</p>
          <p className="text-xs mt-2">Try rephrasing your request or switching to regular search.</p>
        </div>
      )}
    </div>
  );
};

const NormalSearch = ({ initialQuery = "", onResults }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(!!initialQuery);
  const [filterType, setFilterType] = useState("all");
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
          {loading ? SEARCH_CONFIG.labels.regularSearch : "Search"}
        </motion.button>
      </div>

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

      {error && <div className="text-red-500 text-center py-8">{error}</div>}

      {!loading && searched && filteredResults.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-3xl mb-3" />
          <p>No results found for "{query}".</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-20 text-gray-400">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-5xl mb-4 opacity-30" />
          <p className="text-lg">Start typing to search</p>
          <p className="text-sm mt-2">Find movies, TV shows, and people</p>
        </div>
      )}

      {!loading && filteredResults.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-4">
            Found <span className="font-semibold text-blue-400">{filteredResults.length}</span> results for "{query}"
          </p>
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
                    <img
                      src="/placeholder.svg"
                      alt={item.title || item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "/placeholder.svg"; }}
                    />
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
        </div>
      )}
    </div>
  );
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchMode, setSearchMode] = useState(() => {
    return localStorage.getItem("searchMode") || "normal";
  });

  useEffect(() => {
    localStorage.setItem("searchMode", searchMode);
  }, [searchMode]);

  return (
    <div className="min-h-screen pt-24 px-4 bg-white text-black dark:bg-black dark:text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-2 mb-6 w-fit rounded-xl border border-gray-700 p-1">
          <button
            onClick={() => setSearchMode("normal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              searchMode === "normal"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-gray-800"
            }`}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span className="hidden sm:inline">Regular</span>
          </button>
          <button
            onClick={() => setSearchMode("ai")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              searchMode === "ai"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                : "text-gray-400 hover:bg-gray-800"
            }`}>
            <span>{SEARCH_CONFIG.avatar}</span>
            <span className="hidden sm:inline">{SEARCH_CONFIG.name}</span>
            <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-bold">
              {SEARCH_CONFIG.labels.aiBadge}
            </span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {searchMode === "ai" && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-purple-400 text-xl" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {SEARCH_CONFIG.fullName}
                </h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">{SEARCH_CONFIG.tooltip}</p>
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
