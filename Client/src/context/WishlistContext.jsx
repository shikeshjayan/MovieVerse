import { createContext, useContext, useEffect, useState } from "react";
import {
  getWishlist,
  addToWishlist as addToWishlistAPI,
  removeFromWishlist as removeFromWishlistAPI,
  clearWishlist as clearWishlistAPI,
} from "../services/axiosApi";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const normalizeWishlistItem = (item) => {
    const media = item.media || item;
    return {
      id: media.tmdbId || media.id,
      tmdbId: media.tmdbId || media.id,
      title: media.title || media.name || media.original_name,
      poster_path: media.posterPath || media.poster_path,
      backdrop_path: media.backdropPath || media.backdrop_path,
      media_type: media.mediaType || media.media_type || "movie",
      vote_average: media.voteAverage || media.vote_average,
      overview: media.overview,
      release_date:
        media.releaseDate || media.release_date || media.first_air_date,
      genres: media.genres,
      addedAt: item.addedAt,
    };
  };

  const fetchWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    try {
      const response = await getWishlist();
      let items = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && Array.isArray(response.data)) {
        items = response.data;
      }
      setWishlist(items.map(normalizeWishlistItem));
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const addToWishlistHandler = async (item) => {
    if (!isAuthenticated) return;

    const tmdbId = item.tmdbId || item.id;
    const media_type = item.media_type || item.type || "movie";

    const params = {
      tmdbId: Number(tmdbId),
      title: item.title || item.name,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      media_type: media_type === "tvshow" ? "tv" : media_type,
      overview: item.overview,
      release_date: item.release_date || item.first_air_date,
      vote_average: item.vote_average,
      genres: item.genres,
    };
    try {
      const res = await addToWishlistAPI(params);

      // KEY FIX: Update local state based on the backend "action"
      if (res.action === "removed") {
        setWishlist((prev) =>
          prev.filter((i) => Number(i.tmdbId) !== Number(params.tmdbId)),
        );
      } else if (res.action === "added") {
        setWishlist((prev) => [normalizeWishlistItem(res.data), ...prev]);
      }
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
    }
  };

  const removeFromWishlistHandler = async (tmdbId, type) => {
    if (!tmdbId) return;
    if (isAuthenticated) {
      try {
        await removeFromWishlistAPI(tmdbId, type);
        setWishlist((prev) =>
          prev.filter((item) => Number(item.tmdbId) !== Number(tmdbId)),
        );
      } catch (error) {
        console.error("Backend delete failed:", error);
      }
    }
  };

  const isInWishlist = (tmdbId, type) => {
    const normalizedType = type === "tvshow" ? "tv" : type || "movie";
    return wishlist.some(
      (item) =>
        Number(item.tmdbId) === Number(tmdbId) &&
        item.media_type === normalizedType,
    );
  };

  const clearAll = async () => {
    if (isAuthenticated) {
      try {
        await clearWishlistAPI();
        setWishlist([]);
      } catch (error) {
        console.error("Failed to clear database:", error);
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist: addToWishlistHandler,
        wishlistCount: wishlist.length,
        removeFromWishlist: removeFromWishlistHandler,
        isInWishlist,
        clearWishlist: clearAll,
      }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return context;
};
