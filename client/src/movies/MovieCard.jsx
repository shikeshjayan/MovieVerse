/**
 * Movie Details Page Component
 * 
 * Full details page for a movie featuring:
 * - Hero section with backdrop and poster
 * - Wishlist and watch later actions
 * - Cast information carousel
 * - User comment box
 * - TMDB reviews
 * - Similar movies recommendations
 */
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import ImageWithLoader from "../ui/ImageWithLoader";
import TrailerButton from "../components/TrailerButton";
import MediaDetailsSkeleton from "../ui/MediaDetailsSkeleton";
import SimilarMovies from "./SimilarMovies";
import useMovieDetails from "../hooks/useMovieDetails";
import CastWindow from "../ui/CastWindow";
import ReviewWindow from "../ui/ReviewWindow";
import CommentBox from "../components/CommentBox";
import { useWishlist } from "../context/WishlistContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { faHeart, faClock, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Animation variants for staggered content reveal
const posterVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 }
  }
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const buttonVariants = {
  hover: { scale: 1.1 },
  tap: { scale: 0.9 }
};

const MovieCard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToHistory } = useWatchHistory();
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } = useWatchLater();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const { movie, movieKey, loading } = useMovieDetails(id);

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

  if (loading || !movie) return <MediaDetailsSkeleton />;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "/placeholder.svg";

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder.svg";

  return (
    <section className="py-4">
      <motion.div 
        ref={containerRef}
        className="relative w-full min-h-[90vh] text-white bg-gray-900 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="absolute z-50 right-4 top-4 sm:right-6 sm:top-6 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-red-600 transition-colors"
          title="Close"
        >
          <FontAwesomeIcon icon={faXmark} size="lg" />
        </motion.button>

        <motion.div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 blur-sm"
          style={{ backgroundImage: `url(${backdropUrl})`, y: parallaxY }}
        />
        <div className="absolute inset-0" />

        <div className="relative z-10 container mx-auto px-3 sm:px-6 py-8 sm:py-16 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-10">
          <motion.div
            variants={posterVariants}
            initial="hidden"
            animate="visible"
            className="shrink-0 w-40 sm:w-64 md:w-80 lg:w-96 rounded shadow-2xl overflow-hidden"
          >
            <motion.div whileHover={{ scale: 1.05 }} className="rounded shadow-2xl overflow-hidden">
              <ImageWithLoader src={posterUrl} alt={movie.title} className="w-48 h-72 rounded shadow-md object-cover aspect-square" />
            </motion.div>
          </motion.div>

          <motion.div variants={contentVariants} initial="hidden" animate="visible" className="flex-1 flex flex-col gap-4 text-center md:text-left">
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 md:gap-10 items-center justify-center md:justify-start">
              <motion.h1 whileHover={{ scale: 1.02 }} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                {movie.title || movie.name}
              </motion.h1>

              <div className="flex gap-4">
                <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap"
                  onClick={() => {
                    const movieId = movie.id || movie.tmdbId;
                    isInWishlist(movieId, "movie") ? removeFromWishlist(movieId, "movie") : addToWishlist({ id: movieId, title: movie.title, poster_path: movie.poster_path, vote_average: movie.vote_average, media_type: "movie" });
                  }}
                  className="text-white rounded-full p-2"
                >
                  <FontAwesomeIcon icon={faHeart} className={isInWishlist(movie.id, "movie") ? "text-red-500" : "text-white"} size="lg" />
                </motion.button>

                <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap"
                  onClick={() => {
                    const movieId = movie.id || movie.tmdbId;
                    if (isInWatchLater(movieId)) removeFromWatchLater(movieId, "movie");
                    else addToWatchLater({ id: movieId, title: movie.title, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path, vote_average: movie.vote_average, media_type: "movie", overview: movie.overview, release_date: movie.release_date, genres: movie.genres?.map((g) => g.name) }, "movie");
                  }}
                  className="text-white rounded-full p-2"
                >
                  <FontAwesomeIcon icon={faClock} className={isInWatchLater(movie.id) ? "text-blue-500" : "text-white"} size="lg" />
                </motion.button>

                <div className="text-green-500 p-2" title="Watched">
                  <FontAwesomeIcon icon={faCheck} size="lg" />
                </div>
              </div>
            </motion.div>

            {movie.tagline && <motion.p variants={itemVariants} className="text-lg text-gray-400 italic mt-2">"{movie.tagline}"</motion.p>}

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-3 items-center mt-2">
              <span className="px-4 py-1 text-yellow-500 font-bold text-md">★ {movie.vote_average?.toFixed(1) ?? "N/A"}</span>
              {movie.release_date && <span className="px-3 py-1 text-gray-200 text-sm">{new Date(movie.release_date).getFullYear()}</span>}
              {movie.runtime > 0 && <span className="px-3 py-1 text-gray-200 text-sm">{movie.runtime} min</span>}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-2 text-xs uppercase tracking-wide">
              {movie.genres?.map((g) => <span key={g.id} className="px-3 py-1 text-gray-300">{g.name}</span>)}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              {movie.spoken_languages?.map((lang) => <span key={lang.name} className="px-3 py-1 text-gray-300 text-xs uppercase tracking-wide border border-gray-700 rounded">{lang.english_name}</span>)}
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-2xl mt-4">
              <h3 className="text-xl font-semibold mb-2 text-gray-200">Overview</h3>
              <p className="text-gray-300 leading-relaxed text-lg">{movie.overview}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-4 items-center justify-center md:justify-start mt-4">
              <TrailerButton movieKey={movieKey} />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <CastWindow type="movie" />
      <hr className="bg-linear-to-r from-blue-500 to-purple-500 h-px mx-4 my-8 opacity-75" />
      <CommentBox contentId={String(movie.id)} contentTitle={movie.title} contentType="movie" />
      <ReviewWindow type="movie" />
      <hr className="bg-linear-to-r from-blue-500 to-purple-500 h-px mx-4 my-8 opacity-75" />
      <SimilarMovies />
    </section>
  );
};

export default MovieCard;