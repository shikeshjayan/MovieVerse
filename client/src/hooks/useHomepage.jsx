/**
 * Homepage data hook with caching and fallback support
 * Fetches trending, popular, and top-rated movies/TV shows
 * Falls back to direct TMDB API if server is unavailable
 */
import { useState, useEffect, useRef } from "react";
import apiClient from "../services/apiClient";
import { upcomingMovies, trendingMovies, popularMovies, topRatedMovies, upcomingMoviesList, airingTodayTVShows, popularTVShows } from "../services/tmdbApi";

// Client-side cache configuration
const CACHE_KEY = "homepage_data";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get cached homepage data if still valid
 */
const getCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

/**
 * Store homepage data in cache
 */
const setCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {}
};

export const useHomepage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const fetchedRef = useRef(false);

  /**
   * Direct TMDB API fallback when server is unavailable
   * Used as last resort when both server cache and API fail
   */
  const fetchFallbackData = async () => {
    try {
      const [trending, popularMoviesData, popularTV, topRated, upcoming, airingToday] = 
        await Promise.all([
          trendingMovies("week"),
          popularMovies(),
          popularTVShows(),
          topRatedMovies(),
          upcomingMoviesList(),
          airingTodayTVShows(),
        ]);

      return {
        trending,
        popularMovies: popularMoviesData,
        popularTV,
        topRated,
        upcoming,
        airingToday,
      };
    } catch (err) {
      console.error("Fallback fetch error:", err);
      return null;
    }
  };

  useEffect(() => {
    // Prevent double fetching on strict mode
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Check client-side cache first
    const cached = getCache();
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Try server endpoint (uses server-side cache)
        const res = await apiClient.get("/home");
        const result = res.data;
        setCache(result);
        setData(result);
      } catch (err) {
        // Switch to fallback mode on error
        setFallbackMode(true);
        const fallbackData = await fetchFallbackData();
        if (fallbackData) {
          setData(fallbackData);
        } else {
          setError(err.message || "Failed to load homepage");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Force refresh homepage data
   * Clears cache and refetches from server
   */
  const refetch = () => {
    localStorage.removeItem(CACHE_KEY);
    fetchedRef.current = false;
    setLoading(true);
    setError(null);
    setFallbackMode(false);

    const fetchData = async () => {
      try {
        const res = await apiClient.get("/home");
        const result = res.data;
        setCache(result);
        setData(result);
      } catch (err) {
        setFallbackMode(true);
        const fallbackData = await fetchFallbackData();
        if (fallbackData) {
          setData(fallbackData);
        } else {
          setError(err.message || "Failed to load homepage");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  };

  return { data, loading, error, refetch, fallbackMode };
};

export default useHomepage;