import { createContext, useContext, useEffect, useState } from "react";
import {
  getHistory as fetchHistoryAPI,
  addToHistory as addToHistoryAPI,
  clearHistory as clearHistoryAPI,
  removeHistoryItem as removeHistoryItemAPI,
} from "../services/axiosApi";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { ToastMessages } from "../utils/toastConfig";

const WatchHistoryContext = createContext(null);

export const WatchHistoryProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Helper to turn backend media objects into clean frontend objects
  const normalizeEntry = (entry) => {
    const media = entry.media || {};
    return {
      id: media.tmdbId || media.id,
      movieId: media.tmdbId || media.id,
      title: media.title || media.name || media.original_name,
      poster_path: media.posterPath || media.poster_path,
      media_type: media.mediaType || media.media_type || "movie",
      watchedAt: entry.watchedAt,
    };
  };

  const fetchHistory = async () => {
    if (isAuthenticated) {
      setLoading(true);
      try {
        const response = await fetchHistoryAPI();
        const entries = Array.isArray(response?.data) ? response.data : [];
        setHistory(entries.map(normalizeEntry));
      } catch (error) {
        console.error("Failed to sync history with DB", error);
      } finally {
        setLoading(false);
      }
    } else {
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isAuthenticated]);

  const addToHistory = async (item) => {
    if (!isAuthenticated) return;
    try {
      const payload = {
        movieId: Number(item.movieId || item.id),
        title: item.title || item.name,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        media_type: item.media_type || item.type || "movie",
        overview: item.overview,
        release_date: item.release_date || item.first_air_date,
        vote_average: item.vote_average,
      };

      const res = await addToHistoryAPI(payload);

      // Update local state manually
      if (res?.success && res.data) {
        const newEntry = normalizeEntry(res.data);
        setHistory((prev) => {
          // Remove if it already exists (to move it to the top)
          const filtered = prev.filter(
            (i) => Number(i.movieId) !== Number(newEntry.movieId),
          );
          return [newEntry, ...filtered];
        });
      }
    } catch (error) {
      console.error("DB Save failed", error);
    }
  };

  const removeFromHistory = async (movieId, type) => {
    if (!movieId || !isAuthenticated) return;
    const itemToRemove = history.find((item) => Number(item.movieId) === Number(movieId));
    try {
      await removeHistoryItemAPI(movieId, type);

      setHistory((prev) =>
        prev.filter((item) => Number(item.movieId) !== Number(movieId)),
      );
      toast.success(ToastMessages.HISTORY.REMOVE_SUCCESS(itemToRemove?.title || "Item"));
    } catch (error) {
      console.error("DB remove failed", error);
      toast.error(ToastMessages.HISTORY.REMOVE_ERROR);
    }
  };

  const clearHistory = async () => {
    if (!isAuthenticated) return;
    try {
      await clearHistoryAPI();

      setHistory([]);
      toast.success(ToastMessages.HISTORY.CLEAR_SUCCESS);
    } catch (error) {
      console.error("DB Clear failed", error);
      toast.error(ToastMessages.HISTORY.CLEAR_ERROR);
    }
  };

  return (
    <WatchHistoryContext.Provider
      value={{
        history,
        addToHistory,
        removeFromHistory,
        loading,
        clearHistory,
        historyCount: history.length,
      }}>
      {children}
    </WatchHistoryContext.Provider>
  );
};

export const useWatchHistory = () => {
  const context = useContext(WatchHistoryContext);
  if (!context) {
    throw new Error("useWatchHistory must be used inside WatchHistoryProvider");
  }
  return context;
};
