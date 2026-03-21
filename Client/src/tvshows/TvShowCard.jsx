import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect } from "react";
import ImageWithLoader from "../ui/ImageWithLoader";
import TrailerButton from "../components/TrailerButton";
import MediaDetailsSkeleton from "../ui/MediaDetailsSkeleton";
import SimilarTvShows from "./SimilarTvShows";
import useTvShowDetails from "../hooks/useTvShowDetails";
import CastWindow from "./CastWindow";
import ReviewWindow from "./ReviewWindow";
import { useWishlist } from "../context/WishlistContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useWatchLater } from "../context/WatchLaterContext";
import CommentBox from "../components/CommentBox";
import { motion } from "framer-motion";
import { faHeart, faClock, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * TvShowCard Component
 * --------------------
 * Displays detailed information about a TV show:
 * - Backdrop & poster
 * - Title, tagline, rating, year, runtime
 * - Genres & languages
 * - Overview
 * - Trailer button
 * - Wishlist & Watch Later toggle
 * - Cast, reviews, comments, and similar shows
 */
const TvShowCard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { show: shows, showKey, loading } = useTvShowDetails(id);
  
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToHistory } = useWatchHistory();
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } = useWatchLater();

  // Automatically record history on mount
  useEffect(() => {
    if (shows && shows.id) {
      addToHistory({
        id: shows.id,
        title: shows.name || shows.title,
        poster_path: shows.poster_path,
        backdrop_path: shows.backdrop_path,
        vote_average: shows.vote_average,
        media_type: "tv",
        overview: shows.overview,
        release_date: shows.first_air_date,
      });
    }
  }, [shows]);

  // Show skeleton while loading or if show data is missing
  if (loading || !shows) {
    return <MediaDetailsSkeleton />;
  }

  // Build image URLs with fallbacks
  const backdropUrl = shows.backdrop_path
    ? `https://image.tmdb.org/t/p/original${shows.backdrop_path}`
    : "/Loader.svg";

  const posterUrl = shows.poster_path
    ? `https://image.tmdb.org/t/p/w500${shows.poster_path}`
    : "/Loader.svg";

  return (
    <section className="py-4">
      {/* Main details section */}
      <div className="relative w-full min-h-[90vh] text-white bg-gray-900 overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => navigate(-1)}
          className="text-red-500 py-2 rounded fixed z-50 right-4 top-4 sm:right-6 sm:top-30 hover:text-blue-600"
        >
          <span className="hidden sm:inline">Close</span>
          <span className="sm:hidden text-2xl">✕</span>
        </button>

        {/* Blurred backdrop */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 blur-sm"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />

        {/* Overlay to darken backdrop */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-16 flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* Poster */}
          <motion.div 
            className="shrink-0 w-64 md:w-80 lg:w-96 rounded shadow-2xl overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
          >
            <ImageWithLoader
              src={posterUrl}
              alt={shows.title || shows.name}
              className="w-48 h-72 rounded shadow-md object-cover aspect-square"
            />
          </motion.div>

          {/* Show details */}
          <div className="flex-1 flex flex-col gap-4 text-center md:text-left">
            {/* Title & Actions */}
            <div className="flex flex-col md:flex-row gap-10 items-center justify-center md:justify-start">
              <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400">
                {shows.name || shows.title}
              </h1>

              <div className="flex gap-4">
                {/* Wishlist Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const showId = shows.id || shows.tmdbId;
                    isInWishlist(showId, "tv")
                      ? removeFromWishlist(showId, "tv")
                      : addToWishlist({
                          id: showId,
                          title: shows.name || shows.title,
                          poster_path: shows.poster_path,
                          vote_average: shows.vote_average,
                          media_type: "tv",
                        });
                  }}
                  className="text-white rounded-full p-2 transition hover:scale-110"
                  title={isInWishlist(shows.id, "tv") ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <FontAwesomeIcon
                    icon={faHeart}
                    className={
                        isInWishlist(shows.id, "tv")
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
                    const showId = shows.id || shows.tmdbId;
                    if (isInWatchLater(showId)) {
                        removeFromWatchLater(showId, "tv");
                    } else {
                        addToWatchLater({
                            id: showId,
                            title: shows.name || shows.title,
                            poster_path: shows.poster_path,
                            backdrop_path: shows.backdrop_path,
                            vote_average: shows.vote_average,
                            media_type: "tv",
                            overview: shows.overview,
                            release_date: shows.first_air_date,
                            genres: shows.genres?.map(g => g.name)
                        }, "tv");
                    }
                  }}
                  className="text-white rounded-full p-2 transition hover:scale-110"
                  title={isInWatchLater(shows.id) ? "Remove from Watch Later" : "Add to Watch Later"}
                >
                  <FontAwesomeIcon
                    icon={faClock}
                    className={
                        isInWatchLater(shows.id) ? "text-blue-500" : "text-white"
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
            {shows.tagline && (
              <p className="text-lg text-gray-400 italic mt-2">
                "{shows.tagline}"
              </p>
            )}

            {/* Rating, year, runtime */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center mt-2">
              <span className="px-4 py-1 text-yellow-500 font-bold text-md">
                ★ {shows.vote_average ? shows.vote_average.toFixed(1) : "N/A"}
              </span>
              {shows.first_air_date && (
                <span className="px-3 py-1 text-gray-200 text-sm">
                  {new Date(shows.first_air_date).getFullYear()}
                </span>
              )}
              {shows.episode_run_time?.[0] && (
                <span className="px-3 py-1 text-gray-200 text-sm">
                  {shows.episode_run_time[0]} min/episode
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs uppercase tracking-wide">
              {shows.genres?.map((g) => (
                <span key={g.id} className="px-3 py-1 text-gray-300">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Languages */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              {shows.spoken_languages?.map((lang) => (
                <span
                  key={lang.name}
                  className="px-3 py-1 text-gray-300 text-xs uppercase tracking-wide border border-gray-700 rounded"
                >
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
                {shows.overview || "No overview available."}
              </p>
            </div>

            {/* Trailer button */}
            <div className="flex gap-4 items-center justify-center md:justify-start mt-4">
              <TrailerButton movieKey={showKey} />
            </div>
          </div>
        </div>
      </div>

      {/* Cast section */}
      <CastWindow />

      <hr className="bg-linear-to-r from-blue-500 to-purple-500 h-px mx-4 my-8 opacity-75" />

      {/* Comments */}
      <CommentBox
        contentId={String(shows.id)}
        contentTitle={shows.name || shows.title}
        contentType="tv"
      />

      <ReviewWindow />

      <hr className="bg-linear-to-r from-blue-500 to-purple-500 h-px mx-4 my-8 opacity-75" />

      {/* Similar shows */}
      <SimilarTvShows />
    </section>
  );
};

export default TvShowCard;
