import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import ImageWithLoader from "../ui/ImageWithLoader";
import TrailerButton from "../components/TrailerButton";
import MediaDetailsSkeleton from "../ui/MediaDetailsSkeleton";
import SimilarMovies from "./SimilarMovies";
import useMovieDetails from "../hooks/useMovieDetails";
import CastWindow from "./CastWindow";
import ReviewWindow from "./ReviewWindow";
import CommentBox from "../components/CommentBox";
import { useWishlist } from "../context/WishlistContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { motion } from "framer-motion";
import { faHeart, faClock, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * MovieCard Component
 * --------------------------------------------------
 * Displays detailed information about a single movie:
 * - Backdrop and poster with hover effect
 * - Title, tagline, rating, genres, language, and runtime
 * - Wishlist and Watch Later toggle
 * - Trailer button
 * - Cast, reviews, comments, and similar movies
 */
const MovieCard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToHistory } = useWatchHistory();
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } =
    useWatchLater();

  const { movie, movieKey, loading } = useMovieDetails(id);

  // Automatically record history on mount
  useEffect(() => {
    if (movie && movie.id) {
      addToHistory({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        media_type: "movie",
        overview: movie.overview,
        release_date: movie.release_date,
      });
    }
  }, [movie]);

  // Show skeleton while loading
  if (loading || !movie) return <MediaDetailsSkeleton />;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "/Loader.svg";

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/Loader.svg";

  return (
    <section className="py-4">
      {/* Main Movie Section */}
      <div className="relative w-full min-h-[90vh] text-white bg-gray-900 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-red-600 py-2 rounded fixed z-50 right-4 top-4 sm:right-6 sm:top-30 hover:text-blue-600">
          <span className="hidden sm:inline">Close</span>
          <span className="sm:hidden text-2xl">✕</span>
        </button>

        {/* Blurred Backdrop */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 blur-sm"
          style={{ backgroundImage: `url(${backdropUrl})` }}></div>
        <div className="absolute inset-0"></div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-3 sm:px-6 py-8 sm:py-16 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-10">
          {/* Poster Image */}
          <motion.div
            className="shrink-0 w-40 sm:w-64 md:w-80 lg:w-96 rounded shadow-2xl overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}>
            <ImageWithLoader
              src={posterUrl}
              alt={movie.title}
              className="w-48 h-72 rounded shadow-md object-cover aspect-square"
            />
          </motion.div>

          {/* Movie Details */}
          <div className="flex-1 flex flex-col gap-4 text-center md:text-left">
            {/* Title & Actions */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-10 items-center justify-center md:justify-start">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400">
                {movie.title || movie.name}
              </h1>

              <div className="flex gap-4">
                {/* Wishlist Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const movieId = movie.id || movie.tmdbId;
                    isInWishlist(movieId, "movie")
                      ? removeFromWishlist(movieId, "movie")
                      : addToWishlist({
                          id: movieId,
                          title: movie.title,
                          poster_path: movie.poster_path,
                          vote_average: movie.vote_average,
                          media_type: "movie",
                        });
                  }}
                  className="text-white rounded-full p-2 transition hover:scale-110"
                  title={
                    isInWishlist(movie.id, "movie")
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }>
                  <FontAwesomeIcon
                    icon={faHeart}
                    className={
                      isInWishlist(movie.id, "movie")
                        ? "text-red-500"
                        : "text-white"
                    }
                    size="lg"
                  />
                </button>

                {/* Watch Later Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const movieId = movie.id || movie.tmdbId;
                    if (isInWatchLater(movieId)) {
                      removeFromWatchLater(movieId, "movie");
                    } else {
                      addToWatchLater(
                        {
                          id: movieId,
                          title: movie.title,
                          poster_path: movie.poster_path,
                          backdrop_path: movie.backdrop_path,
                          vote_average: movie.vote_average,
                          media_type: "movie",
                          overview: movie.overview,
                          release_date: movie.release_date,
                          genres: movie.genres?.map((g) => g.name),
                        },
                        "movie",
                      );
                    }
                  }}
                  className="text-white rounded-full p-2 transition hover:scale-110"
                  title={
                    isInWatchLater(movie.id)
                      ? "Remove from Watch Later"
                      : "Add to Watch Later"
                  }>
                  <FontAwesomeIcon
                    icon={faClock}
                    className={
                      isInWatchLater(movie.id) ? "text-blue-500" : "text-white"
                    }
                    size="lg"
                  />
                </button>

                {/* Indicator for Watched (History) */}
                <div className="text-green-500 p-2" title="Watched">
                  <FontAwesomeIcon icon={faCheck} size="lg" />
                </div>
              </div>
            </div>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-lg text-gray-400 italic mt-2">
                "{movie.tagline}"
              </p>
            )}

            {/* Ratings, Year, Runtime */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center mt-2">
              <span className="px-4 py-1 text-yellow-500 font-bold text-md">
                ★ {movie.vote_average?.toFixed(1) ?? "N/A"}
              </span>
              {movie.release_date && (
                <span className="px-3 py-1 text-gray-200 text-sm">
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}
              {movie.runtime > 0 && (
                <span className="px-3 py-1 text-gray-200 text-sm">
                  {movie.runtime} min
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs uppercase tracking-wide">
              {movie.genres?.map((g) => (
                <span key={g.id} className="px-3 py-1 text-gray-300">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Languages */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              {movie.spoken_languages?.map((lang) => (
                <span
                  key={lang.name}
                  className="px-3 py-1 text-gray-300 text-xs uppercase tracking-wide border border-gray-700 rounded">
                  {lang.english_name}
                </span>
              ))}
            </div>

            {/* Overview */}
            <div className="max-w-2xl mt-4">
              <h3 className="text-xl font-semibold mb-2 text-gray-200">
                Overview
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                {movie.overview}
              </p>
            </div>

            {/* Trailer Button */}
            <div className="flex gap-4 items-center justify-center md:justify-start mt-4">
              <TrailerButton movieKey={movieKey} />
            </div>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      <CastWindow />

      <hr className="bg-linear-to-r from-blue-500 to-purple-500 h-px mx-4 my-8 opacity-75" />

      {/* Comments & Reviews */}
      <CommentBox
        contentId={String(movie.id)}
        contentTitle={movie.title}
        contentType="movie"
      />

      <ReviewWindow />

      <hr className="bg-linear-to-r from-blue-500 to-purple-500 h-px mx-4 my-8 opacity-75" />

      {/* Similar Movies */}
      <SimilarMovies />
    </section>
  );
};

export default MovieCard;
