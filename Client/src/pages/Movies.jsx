import { useEffect, useState } from "react";
import { allMovies, fetchMoviesByGenre } from "../services/tmdbApi";
import { useNavigate } from "react-router-dom";
import Banner from "../movies/Banner";
import GenreBar from "../movies/GenreBar";
import ImageWithLoader from "../ui/ImageWithLoader";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useAuth } from "../context/AuthContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faHeart, faFilm } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useWishlist } from "../context/WishlistContext";

const Movies = () => {
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } = useWatchLater();
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [genre, setGenre] = useState("trending");
  const { addToHistory } = useWatchHistory();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Navigate to movie details and add to history
  const handleMovieClick = (movie) => {
    if (!user) {
      navigate("/login", {
        state: { from: `/movie/${movie.id}` },
        replace: true,
      });
      return;
    }

    addToHistory({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      type: "movie",
    });

    navigate(`/movie/${movie.id}`);
  };

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setPage(1);

      try {
        const data = genre === "trending" 
          ? await allMovies(1) 
          : await fetchMoviesByGenre(genre, 1);
        
        if (active) {
          const results = data?.results || data || [];
          setMovies(results);
          setHasMore(results.length >= 20);
        }
      } catch (err) {
        if (active) setError("Failed to load movies");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [genre]);

  const loadMoreMovies = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = genre === "trending" 
        ? await allMovies(nextPage) 
        : await fetchMoviesByGenre(genre, nextPage);
      
      const results = data?.results || data || [];
      setMovies(prev => [...prev, ...results]);
      setPage(nextPage);
      setHasMore(results.length >= 20);
    } catch (err) {
      setError("Failed to load more movies");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGenreChange = (id) => {
    setGenre(id);
  };

  return (
    <section className="py-5 flex flex-col gap-6">
      {/* -------------------- Banner -------------------- */}
      <Banner />

      {/* -------------------- Genre Selection -------------------- */}
      <GenreBar setGenre={handleGenreChange} />

      {/* -------------------- Movies Grid -------------------- */}
      <h4 className="text-3xl px-4">Movies</h4>

      {loading && <p className="text-center text-gray-400">Loading movies...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!loading && !error && movies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FontAwesomeIcon icon={faFilm} className="text-4xl mb-4" />
          <p>No movies found</p>
        </div>
      )}

      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 justify-items-center px-3 sm:px-4"
        role="list"
        aria-label="Movies list">
        {movies.map((movie) => {
          if (!movie.poster_path) return null;

          const isInWatchLaterFlag = isInWatchLater(movie.id);

          return (
            <motion.div
              key={movie.id}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 260 }}
              className="shrink-0"
              role="listitem"
              aria-label={`Movie: ${movie.title || movie.name}`}>
              <div
                onClick={() => handleMovieClick(movie)}
                onKeyDown={(e) => e.key === "Enter" && handleMovieClick(movie)}
                tabIndex={0}
                role="button"
                className="relative group cursor-pointer">
                {/* Movie Poster */}
                <ImageWithLoader
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                  alt={movie.original_title || movie.name}
                  className="w-48 h-72 rounded shadow-md object-cover"
                  onError={(e) => {
                    e.target.src = "/Loader.svg";
                  }}
                />

                {/* Watch Later Button */}
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigation
                      isInWatchLaterFlag
                        ? removeFromWatchLater(movie.id, "movie")
                        : addToWatchLater(movie, "movie");
                    }}
                    aria-label={
                      isInWatchLater
                        ? `Remove ${movie.title} from watch later`
                        : `Add ${movie.title} to watch later`
                    }
                    className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-sm
                  opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 ease-in-out cursor-pointer shadow">
                    {isInWatchLaterFlag ? (
                      <FontAwesomeIcon icon={faBookmark} />
                    ) : (
                      <FontAwesomeIcon icon={faClock} />
                    )}
                  </button>
                )}

                {/* Wishlist */}
                {user && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    isInWishlist(movie.id, "movie")
                      ? removeFromWishlist(movie.id, "movie")
                      : addToWishlist({
                          id: movie.id,
                          title: movie.title,
                          poster_path: movie.poster_path,
                          vote_average: movie.vote_average,
                          type: "movie",
                        });
                  }}
                  className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                  <FontAwesomeIcon
                    icon={faHeart}
                    style={{ color: isInWishlist(movie.id, "movie") ? "#FF0000" : "#FFFFFF" }}
                    className="cursor-pointer"
                  />
                </button>
                )}

                {/* Rating Badge */}
                <span
                  className="absolute bottom-10 left-2 bg-yellow-500 text-black font-bold text-sm px-3 py-1 rounded
                    opacity-100 md:opacity-100 md:group-hover:opacity-100 transition-opacity duration-300">
                  ★ {movie.vote_average?.toFixed(1) ?? "N/A"}
                </span>

                {/* Movie Title */}
                <h5 className="w-full max-w-48 px-2 text-center mt-2 truncate text-sm sm:text-base">
                  {movie.name || movie.title}
                </h5>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* -------------------- Load More -------------------- */}
      {hasMore && !loading && (
        <div className="w-full flex justify-center py-4">
          <motion.button
            whileHover={{ scale: loadingMore ? 1 : 1.05 }}
            whileTap={{ scale: loadingMore ? 1 : 0.95 }}
            disabled={loadingMore}
            onClick={loadMoreMovies}
            className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load More"}
          </motion.button>
        </div>
      )}
    </section>
  );
};

export default Movies;