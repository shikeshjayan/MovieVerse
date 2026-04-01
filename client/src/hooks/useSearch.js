/**
 * Search hook with debouncing and cancellation support
 * Fetches paginated search results from TMDB
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchSearch } from "../services/tmdbApi";
import { debounce } from "lodash";

export const useSearch = (options = {}) => {
  const { maxPages = 1, debounceMs = 400 } = options;
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  const abortControllerRef = useRef(null);

  /**
   * Execute search with pagination
   * Supports request cancellation for rapid query changes
   */
  const performSearch = useCallback(
    async (searchQuery) => {
      // Cancel any pending request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Clear results for empty queries
      if (!searchQuery?.trim()) {
        setResults([]);
        setTotalResults(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch first page
        const firstPageData = await fetchSearch(searchQuery, 1, controller.signal);

        // Check if request was cancelled during fetch
        if (controller.signal.aborted) return;

        if (!firstPageData) throw new Error("No data returned");

        // Limit pages based on options
        const totalPages = Math.min(firstPageData.total_pages, maxPages);
        setTotalResults(firstPageData.total_results);

        // Single page - return immediately
        if (totalPages <= 1) {
          setResults(firstPageData.results ?? []);
          setLoading(false);
          return;
        }

        // Fetch remaining pages concurrently
        const remainingPromises = Array.from(
          { length: totalPages - 1 },
          (_, i) => fetchSearch(searchQuery, i + 2, controller.signal),
        );

        const remainingData = await Promise.all(remainingPromises);

        if (controller.signal.aborted) return;

        // Merge all results
        const allResults = [
          ...(firstPageData.results ?? []),
          ...remainingData.flatMap((d) => d?.results ?? []),
        ];

        setResults(allResults);
      } catch (err) {
        // Ignore abort errors (expected during rapid typing)
        if (err.name === "AbortError") return;
        setError("Search failed. Please try again.");
        setResults([]);
        console.error("Search error:", err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [maxPages],
  );

  // Debounce search to prevent excessive API calls
  const debouncedSearch = useCallback(
    debounce((q) => performSearch(q), debounceMs),
    [performSearch, debounceMs],
  );

  // Cleanup on unmount or query change
  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
      abortControllerRef.current?.abort();
    };
  }, [query, debouncedSearch]);

  return {
    query,
    results,
    loading,
    error,
    totalResults,
    search: (q) => setQuery(q),
    clear: () => {
      setQuery("");
      setResults([]);
      setTotalResults(0);
    },
    isComplete: !loading && results.length > 0,
  };
};
