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

  const abortRef = useRef(false);

  const performSearch = useCallback(
    async (searchQuery) => {
      if (!searchQuery?.trim()) {
        setResults([]);
        setTotalResults(0);
        return;
      }

      setLoading(true);
      setError(null);
      abortRef.current = false;

      try {
        const firstPageData = await fetchSearch(searchQuery, 1);

        if (abortRef.current) return;

        if (!firstPageData) throw new Error("No data returned");

        const totalPages = Math.min(firstPageData.total_pages, maxPages);
        const totalResults = firstPageData.total_results;

        if (totalPages <= 1) {
          setResults(firstPageData.results ?? []);
          setTotalResults(totalResults);
          setLoading(false);
          return;
        }

        const remainingPromises = Array.from(
          { length: totalPages - 1 },
          (_, i) => fetchSearch(searchQuery, i + 2),
        );

        const remainingData = await Promise.all(remainingPromises);

        if (abortRef.current) return;

        const allResults = [
          ...(firstPageData.results ?? []),
          ...remainingData.flatMap((d) => d?.results ?? []),
        ];

        setResults(allResults);
        setTotalResults(totalResults);
      } catch (err) {
        if (!abortRef.current) {
          setError("Search failed. Please try again.");
          setResults([]);
          console.error("Search error:", err);
        }
      } finally {
        if (!abortRef.current) {
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
    abortRef.current = true;
    debouncedSearch(query);

    return () => {
      abortRef.current = true;
      debouncedSearch.cancel();
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
