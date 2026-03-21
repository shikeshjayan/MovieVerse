import { useState, useEffect, useRef } from "react";
import apiClient from "../services/apiClient";
import { upcomingMovies, trendingMovies, popularMovies, topRatedMovies, upcomingMoviesList, airingTodayTVShows, popularTVShows } from "../services/tmdbApi";

const CACHE_KEY = "homepage_data";
const CACHE_DURATION = 10 * 60 * 1000;

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
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cached = getCache();
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await apiClient.get("/home");
        const result = res.data;
        setCache(result);
        setData(result);
      } catch (err) {
        console.log("Primary API failed, using fallback:", err.message);
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