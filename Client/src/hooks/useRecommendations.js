// src/hooks/useRecommendations.js
import { useState, useEffect, useContext } from "react";
import { getRecommendationsService } from "../services/axiosApi.js";
import { AuthContext } from "../context/AuthContext";
import { useUserPreferences, AVAILABLE_GENRES } from "../context/UserPreferencesContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useWishlist } from "../context/WishlistContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { fetchMoviesByGenre, fetchTvShowsByGenre } from "../services/tmdbApi";

const useRecommendations = () => {
  const { user } = useContext(AuthContext);
  const { selectedGenres, hasOnboarded } = useUserPreferences();
  const { history } = useWatchHistory();
  const { wishlist } = useWishlist();
  const { watchLater } = useWatchLater();

  const hasUserActivity = Boolean(history?.length > 0 || wishlist?.length > 0 || watchLater?.length > 0);

  const [movies, setMovies] = useState([]);
  const [source, setSource] = useState("");
  const [topGenres, setTopGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGenreBasedRecommendations = async () => {
    const genreMovies = [];
    const genresToFetch = selectedGenres.slice(0, 4);
    
    for (const genreId of genresToFetch) {
      try {
        const [movieData, tvData] = await Promise.all([
          fetchMoviesByGenre(genreId, 1),
          fetchTvShowsByGenre(genreId, 1),
        ]);
        
        const genreInfo = AVAILABLE_GENRES.find(g => g.id === genreId);
        const allResults = [...(movieData.results || []), ...(tvData.results || [])];
        
        const mapped = allResults.slice(0, 10).map(m => ({
          id: m.id,
          title: m.title || m.name,
          poster_path: m.poster_path,
          vote_average: m.vote_average,
          mediaType: m.title ? 'movie' : 'tv',
          reason: `Because you like ${genreInfo?.name || 'movies'}`,
        }));
        genreMovies.push(...mapped);
      } catch (e) {
        console.warn(`Failed to fetch genre ${genreId}:`, e);
      }
    }
    
    return genreMovies;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const getRecommendations = async () => {
      if (!user) {
        if (hasOnboarded && selectedGenres.length > 0) {
          try {
            const genreMovies = await fetchGenreBasedRecommendations();
            if (!cancelled) {
              if (genreMovies.length > 0) {
                setMovies(genreMovies);
                setSource("genre-preferences");
                const genreNames = selectedGenres
                  .map(id => AVAILABLE_GENRES.find(g => g.id === id)?.name)
                  .filter(Boolean);
                setTopGenres(genreNames.map(name => ({ name, count: 10 })));
              } else {
                setMovies([]);
              }
            }
          } catch (e) {
            if (!cancelled) setError(e.message);
          }
        }
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const data = await getRecommendationsService();
        if (cancelled) return;

        const rawMovies = data.data ?? [];
        const apiSource = data.source ?? "";
        
        if (hasUserActivity && rawMovies.length > 0) {
          const normalized = rawMovies.map((m) => ({
            id: m.tmdbId || m.id,
            title: m.title,
            poster_path: m.posterPath || m.poster_path,
            vote_average: m.voteAverage || m.vote_average,
            mediaType: m.mediaType,
            reason: m.reason,
          }));
          setMovies(normalized);
          setSource(apiSource);
          setTopGenres(data.topGenres ?? []);
        } else if (hasOnboarded && selectedGenres.length > 0) {
          const genreMovies = await fetchGenreBasedRecommendations();
          if (!cancelled) {
            if (genreMovies.length > 0) {
              setMovies(genreMovies);
              setSource("genre-preferences");
              const genreNames = selectedGenres
                .map(id => AVAILABLE_GENRES.find(g => g.id === id)?.name)
                .filter(Boolean);
              setTopGenres(genreNames.map(name => ({ name, count: 10 })));
            } else if (rawMovies.length > 0) {
              const normalized = rawMovies.map((m) => ({
                id: m.tmdbId || m.id,
                title: m.title,
                poster_path: m.posterPath || m.poster_path,
                vote_average: m.voteAverage || m.vote_average,
                mediaType: m.mediaType,
                reason: m.reason,
              }));
              setMovies(normalized);
              setSource(apiSource);
              setTopGenres(data.topGenres ?? []);
            }
          }
        } else if (rawMovies.length > 0) {
          const normalized = rawMovies.map((m) => ({
            id: m.tmdbId || m.id,
            title: m.title,
            poster_path: m.posterPath || m.poster_path,
            vote_average: m.voteAverage || m.vote_average,
            mediaType: m.mediaType,
            reason: m.reason,
          }));
          setMovies(normalized);
          setSource(apiSource);
          setTopGenres(data.topGenres ?? []);
        } else {
          setMovies([]);
          setSource("");
        }
      } catch (error) {
        if (!cancelled) {
          if (hasOnboarded && selectedGenres.length > 0) {
            const genreMovies = await fetchGenreBasedRecommendations();
            if (!cancelled) {
              setMovies(genreMovies);
              setSource("genre-preferences");
            }
          } else {
            setError(error.response?.data?.message || "Failed to load recommendations");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    getRecommendations();

    return () => {
      cancelled = true;
    };
  }, [user, hasOnboarded, selectedGenres, hasUserActivity, history, wishlist, watchLater]);

  return { movies, source, topGenres, loading, error };
};

export default useRecommendations;
