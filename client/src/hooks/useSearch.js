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

  const performSearch = useCallback(
    async (searchQuery) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (!searchQuery?.trim()) {
        setResults([]);
        setTotalResults(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const firstPageData = await fetchSearch(searchQuery, 1, controller.signal);

        if (controller.signal.aborted) return;

        if (!firstPageData) throw new Error("No data returned");

        const totalPages = Math.min(firstPageData.total_pages, maxPages);
        setTotalResults(firstPageData.total_results);

        if (totalPages <= 1) {
          setResults(firstPageData.results ?? []);
          setLoading(false);
          return;
        }

        const remainingPromises = Array.from(
          { length: totalPages - 1 },
          (_, i) => fetchSearch(searchQuery, i + 2, controller.signal),
        );

        const remainingData = await Promise.all(remainingPromises);

        if (controller.signal.aborted) return;

        const allResults = [
          ...(firstPageData.results ?? []),
          ...remainingData.flatMap((d) => d?.results ?? []),
        ];

        setResults(allResults);
      } catch (err) {
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

  const debouncedSearch = useCallback(
    debounce((q) => performSearch(q), debounceMs),
    [performSearch, debounceMs],
  );

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
