/* eslint-disable no-unused-vars */
import { useEffect, useRef, useReducer, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchSearch } from "../../services/tmdbApi";
import SearchResult from "./SearchResult";
import { useVoiceSearch } from "../../hooks/useVoiceSearch";
import {
  faMagnifyingGlass,
  faMicrophone,
  faClockRotateLeft,
  faXmark,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const RECENT_SEARCHES_KEY = "rmdb_recent_searches";
const MAX_RECENT_SEARCHES = 5;

const initialState = {
  inputValue: "",
  movies: [],
  activeIndex: -1,
  showResults: false,
  recentSearches: [],
  loading: false,
};

function loadRecentSearches() {
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  if (!query.trim()) return;
  const recent = loadRecentSearches();
  const filtered = recent.filter(
    (s) => s.toLowerCase() !== query.toLowerCase(),
  );
  const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_INPUT":
      return { ...state, inputValue: action.payload };
    case "SET_RESULTS":
      return {
        ...state,
        movies: action.payload,
        showResults: true,
        activeIndex: -1,
        loading: false,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ACTIVE_INDEX":
      return { ...state, activeIndex: action.payload };
    case "CLEAR":
      return {
        ...initialState,
        recentSearches: state.recentSearches,
        showFilters: state.showFilters,
      };
    case "HIDE_RESULTS":
      return { ...state, movies: [], showResults: false, activeIndex: -1 };
    case "SET_RECENT_SEARCHES":
      return { ...state, recentSearches: action.payload };
    case "REMOVE_RECENT": {
      const filtered = state.recentSearches.filter(
        (_, i) => i !== action.payload,
      );
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
      return { ...state, recentSearches: filtered };
    }
    default:
      return state;
  }
}

/* ── Voice wave animation ── */
const VoiceWave = ({ active }) => (
  <div className="flex gap-1 items-end h-4">
    {[1, 2, 3].map((i) => (
      <motion.span
        key={i}
        animate={
          active ? { height: ["20%", "100%", "30%"] } : { height: "20%" }
        }
        transition={{
          repeat: active ? Infinity : 0,
          duration: 0.6,
          ease: "easeInOut",
          delay: i * 0.1,
        }}
        className="w-1 bg-red-500 rounded"
      />
    ))}
  </div>
);

/* ── Recent searches ── */
const RecentSearches = ({ recentSearches, onSelect, onRemove }) => {
  if (!recentSearches.length) return null;

  return (
    <div className="p-2 border-t border-gray-700">
      <div className="flex items-center px-2 py-1">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <FontAwesomeIcon icon={faClockRotateLeft} className="w-3 h-3" />
          Recent
        </span>
      </div>
      {recentSearches.map((search, idx) => (
        <div
          key={idx}
          onClick={() => onSelect(search)}
          className="flex items-center justify-between px-3 py-2 hover:bg-gray-700/50 rounded cursor-pointer group">
          <span className="text-sm text-gray-300">{search}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(idx);
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity">
            <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

/* ── Main SearchBox ── */
const SearchBox = () => {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    recentSearches: loadRecentSearches(),
  });

  const {
    inputValue,
    movies,
    activeIndex,
    showResults,
    recentSearches,
    loading,
  } = state;

  const requestIdRef = useRef(0);
  const debounceRef = useRef(null); // ✅ debounce ref

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);

  const { isListening, isSupported, startListening, stopListening } =
    useVoiceSearch({
      onResult: (text) => dispatch({ type: "SET_INPUT", payload: text }),
      onFinalResult: async (text) => {
        dispatch({ type: "SET_INPUT", payload: text });
        await performSearch(text);
      },
      silenceTimeout: 2000,
    });

  /* ── Filter helper ── */
  const filterResults = (results = []) =>
    results.filter((item) => item.media_type !== "person");

  /* ── Perform full search ── */
  const performSearch = async (query) => {
    if (!query?.trim()) return;

    saveRecentSearch(query);
    dispatch({ type: "SET_RECENT_SEARCHES", payload: loadRecentSearches() });
    dispatch({ type: "SET_LOADING", payload: true });

    const currentRequestId = ++requestIdRef.current;
    const data = await fetchSearch(query);

    if (currentRequestId === requestIdRef.current) {
      const filtered = filterResults(data?.results ?? []);
      dispatch({ type: "SET_RESULTS", payload: filtered });
    }
  };

  /* ── Input change with debounce ── */
  const handleInputChange = (e) => {
    const val = e.target.value;
    dispatch({ type: "SET_INPUT", payload: val });

    if (isListening) stopListening();

    clearTimeout(debounceRef.current); // ✅ clear previous debounce

    if (val.trim().length > 1) {
      setShowRecentDropdown(false);

      debounceRef.current = setTimeout(async () => {
        dispatch({ type: "SET_LOADING", payload: true });
        const currentRequestId = ++requestIdRef.current;
        const data = await fetchSearch(val);

        if (currentRequestId === requestIdRef.current) {
          const allResults = data?.results ?? [];

          setSuggestions(
            allResults.filter((i) => i.media_type !== "person").slice(0, 5),
          );
          setShowSuggestions(true);

          dispatch({ type: "SET_RESULTS", payload: filterResults(allResults) });
          dispatch({ type: "SET_LOADING", payload: false });
        }
      }, 400);
    } else if (val.trim().length === 0) {
      setShowSuggestions(false);
      setShowRecentDropdown(true);
      setSuggestions([]);
      dispatch({ type: "HIDE_RESULTS" });
    }
  };

  /* ── Keyboard navigation ── */
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setShowSuggestions(false);
      setShowRecentDropdown(false);
      dispatch({ type: "CLEAR" });
      return;
    }

    if (!showResults || !movies.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        dispatch({
          type: "SET_ACTIVE_INDEX",
          payload: activeIndex < movies.length - 1 ? activeIndex + 1 : 0,
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        dispatch({
          type: "SET_ACTIVE_INDEX",
          payload: activeIndex > 0 ? activeIndex - 1 : movies.length - 1,
        });
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) {
          const item = movies[activeIndex];
          const route =
            item.media_type === "tv"
              ? `/tvshow/${item.id}`
              : `/movie/${item.id}`;
          navigate(route); // ✅ no full page reload
          dispatch({ type: "CLEAR" });
        } else if (inputValue.trim()) {
          saveRecentSearch(inputValue);
          dispatch({
            type: "SET_RECENT_SEARCHES",
            payload: loadRecentSearches(),
          });
        }
        break;
      default:
        break;
    }
  };

  /* ── Reset active index when results change ── */
  useEffect(() => {
    dispatch({ type: "SET_ACTIVE_INDEX", payload: -1 });
  }, [movies]);

  /* ── Cleanup debounce on unmount ── */
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  /* ── Suggestion click ── */
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.media_type === "person") {
      navigate(`/search?q=${encodeURIComponent(suggestion.name)}`);
    } else {
      const route =
        suggestion.media_type === "tv"
          ? `/tvshow/${suggestion.id}`
          : `/movie/${suggestion.id}`;
      navigate(route);
    }
    setShowSuggestions(false);
    dispatch({ type: "HIDE_RESULTS" });
  };

  /* ── Recent search select ── */
  const handleRecentSelect = async (search) => {
    dispatch({ type: "SET_INPUT", payload: search });
    setShowRecentDropdown(false);
    await performSearch(search);
  };

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full sm:w-105 md:w-125 z-50">
      <form onSubmit={(e) => e.preventDefault()} className="relative">
        {/* ── Input row ── */}
        <div className="relative flex items-center">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </span>

          <input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (!inputValue.trim()) setShowRecentDropdown(true);
            }}
            onBlur={() =>
              setTimeout(() => {
                setShowRecentDropdown(false);
                setShowSuggestions(false);
              }, 200)
            }
            type="text"
            placeholder="Search movies, shows..."
            className="w-full h-10 pl-10 pr-24 rounded border border-blue-900 bg-transparent text-blue-400 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {/* Keyboard hint */}
          {!inputValue && (
            <span className="absolute right-16 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] text-gray-500 pointer-events-none">
              <kbd className="px-1.5 py-0.5 bg-gray-800/50 rounded text-[9px] font-mono border border-gray-700">
                {isMac ? "⌘" : "Ctrl"}K
              </kbd>
            </span>
          )}

          {/* Voice wave */}
          {isListening && (
            <div className="absolute right-16 top-3">
              <VoiceWave active />
            </div>
          )}

          {/* Loading spinner */}
          {loading && !isListening && (
            <div className="absolute right-4 top-2.5">
              <FontAwesomeIcon
                icon={faSpinner}
                className="animate-spin text-blue-400"
              />
            </div>
          )}

          {/* Microphone */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={!isSupported}
            className={`absolute right-3 top-2.5 transition-colors ${
              isListening ? "text-red-500" : "text-gray-400 hover:text-blue-400"
            }`}
            aria-label={isListening ? "Stop listening" : "Start voice search"}>
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
        </div>

        {/* ── Suggestions dropdown ── */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-full max-w-[95vw] sm:max-w-150 bg-gray-900/90 backdrop-blur rounded shadow-xl border border-gray-700 z-40">
              <div className="p-2 text-xs text-gray-500 border-b border-gray-700">
                Suggestions
              </div>
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSuggestionClick(s)}
                  className="flex items-center gap-3 p-3 hover:bg-blue-500/30 cursor-pointer transition-colors">
                  <img
                    src={
                      s.poster_path
                        ? `https://image.tmdb.org/t/p/w92${s.poster_path}`
                        : "/over.jpg"
                    }
                    alt={s.title || s.name}
                    onError={(e) => {
                      e.target.src = "/over.jpg";
                    }}
                    className="w-8 h-12 object-cover rounded"
                  />
                  <div>
                    <div className="text-sm text-gray-200">
                      {s.title || s.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {s.release_date?.slice(0, 4) ||
                        s.first_air_date?.slice(0, 4) ||
                        "N/A"}
                      {" · "}
                      {s.media_type}
                    </div>
                  </div>
                </div>
              ))}
              <div
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(inputValue)}`);
                  setShowSuggestions(false);
                  dispatch({ type: "CLEAR" });
                }}
                className="p-3 text-center text-sm text-blue-400 hover:bg-blue-500/30 cursor-pointer border-t border-gray-700 transition-colors">
                View all results for "{inputValue}"
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Recent searches dropdown ── */}
        <AnimatePresence>
          {showRecentDropdown &&
            recentSearches.length > 0 &&
            !inputValue.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-full max-w-[95vw] sm:max-w-150 bg-gray-900/90 backdrop-blur rounded shadow-xl border border-gray-700 z-40">
                <RecentSearches
                  recentSearches={recentSearches}
                  onSelect={handleRecentSelect}
                  onRemove={(idx) =>
                    dispatch({ type: "REMOVE_RECENT", payload: idx })
                  }
                />
              </motion.div>
            )}
        </AnimatePresence>

        {/* ── Accessibility ── */}
        <div aria-live="polite" className="sr-only">
          {isListening ? "Listening for voice input" : "Voice input stopped"}
        </div>
      </form>

      {/* ── Results panel (only show when no suggestions are displayed) ── */}
      {showResults && !showSuggestions && (
        <SearchResult
          movies={movies}
          activeIndex={activeIndex}
          setActiveIndex={(i) =>
            dispatch({ type: "SET_ACTIVE_INDEX", payload: i })
          }
          onClose={() => dispatch({ type: "CLEAR" })}
        />
      )}
    </motion.div>
  );
};

export default SearchBox;
