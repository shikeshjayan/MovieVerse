import { createContext, useContext, useEffect, useState } from "react";
import {
  getWatchLaterService,
  addToWatchLaterService,
  removeFromWatchLaterService,
  clearWatchLaterService,
} from "../services/axiosApi";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { ToastMessages } from "../utils/toastConfig";

const WatchLaterContext = createContext(null);

export const WatchLaterProvider = ({ children }) => {
  const [watchLater, setWatchLater] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchWatchLater = async () => {
    if (!isAuthenticated) {
      setWatchLater([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getWatchLaterService();

      let raw = [];
      if (Array.isArray(res)) {
        raw = res;
      } else if (res && Array.isArray(res.data)) {
        raw = res.data;
      }

      const normalizedList = raw.map((entry) => {
        const media = entry.media || entry;
        return {
          movieId: Number(media.tmdbId || media.id),
          title: media.title || media.name || media.original_name,
          poster_path: media.posterPath || media.poster_path,
          backdrop_path: media.backdropPath || media.backdrop_path,
          overview: media.overview,
          release_date:
            media.releaseDate || media.release_date || media.first_air_date,
          vote_average: media.voteAverage || media.vote_average,
          genres: media.genres,
          media_type: media.mediaType || media.media_type || "movie",
          addedAt: entry.addedAt,
        };
      });

      setWatchLater(normalizedList);
    } catch (err) {
      console.error("Failed to sync watch later", err);
      if (err.response) {
        console.error("Server error:", err.response.status, err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchLater();
  }, [isAuthenticated]);

  const addToWatchLater = async (item, type) => {
    if (!isAuthenticated) return;

    try {
      const normalized = {
        movieId: Number(item.movieId || item.id),
        title: item.title || item.name,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        release_date: item.release_date || item.first_air_date,
        vote_average: item.vote_average,
        genres: item.genres,
        media_type: item.media_type || item.type || type || "movie",
      };
      const res = await addToWatchLaterService(normalized);
      if (res.action === "removed") {
        setWatchLater((prev) =>
          prev.filter((m) => m.movieId !== normalized.movieId),
        );
        toast.success(ToastMessages.WATCH_LATER.REMOVE_SUCCESS(normalized.title));
      } else {
        const newEntry = {
          ...normalized,
          addedAt: res.addedAt || new Date().toISOString(),
        };
        setWatchLater((prev) => [newEntry, ...prev]);
        toast.success(ToastMessages.WATCH_LATER.ADD_SUCCESS(normalized.title));
      }
    } catch (err) {
      console.error("DB add failed", err);
      toast.error(ToastMessages.WATCH_LATER.UPDATE_ERROR);
    }
  };

  const removeFromWatchLater = async (movieId, type) => {
    if (!movieId || !isAuthenticated) return;
    const itemToRemove = watchLater.find((item) => Number(item.movieId) === Number(movieId));
    try {
      await removeFromWatchLaterService(Number(movieId), type);
      setWatchLater((prev) =>
        prev.filter((item) => item.movieId !== Number(movieId)),
      );
      toast.success(ToastMessages.WATCH_LATER.REMOVE_SUCCESS(itemToRemove?.title || "Item"));
    } catch (err) {
      console.error("DB remove failed", err);
      toast.error(ToastMessages.WATCH_LATER.REMOVE_ERROR);
    }
  };

  const clearWatchLater = async () => {
    if (!isAuthenticated) return;
    try {
      await clearWatchLaterService();
      setWatchLater([]);
      toast.success(ToastMessages.WATCH_LATER.CLEAR_SUCCESS);
    } catch (err) {
      console.error("DB clear failed", err);
      toast.error(ToastMessages.WATCH_LATER.CLEAR_ERROR);
    }
  };

  const isInWatchLater = (id) => {
    if(!id) return false;
    return watchLater.some(
      (item) => Number(item.movieId) === Number(id),
    );
  };

  return (
    <WatchLaterContext.Provider
      value={{
        watchLater,
        addToWatchLater,
        removeFromWatchLater,
        isInWatchLater,
        clearWatchLater,
        watchLaterCount: watchLater.length,
        loading,
      }}>
      {children}
    </WatchLaterContext.Provider>
  );
};

export const useWatchLater = () => {
  const context = useContext(WatchLaterContext);
  if (!context) {
    throw new Error("useWatchLater must be used inside WatchLaterProvider");
  }
  return context;
};
