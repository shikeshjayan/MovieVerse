import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import ImageWithLoader from "../ui/ImageWithLoader";
import TrailerButton from "../components/TrailerButton";
import MediaDetailsSkeleton from "../ui/MediaDetailsSkeleton";
import SimilarTvShows from "./SimilarTvShows";
import useTvShowDetails from "../hooks/useTvShowDetails";
import CastWindow from "../ui/CastWindow";
import ReviewWindow from "../ui/ReviewWindow";
import { useWishlist } from "../context/WishlistContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useWatchLater } from "../context/WatchLaterContext";
import CommentBox from "../components/CommentBox";
import { motion, useScroll, useTransform } from "framer-motion";
import { faHeart, faClock, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const posterVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const buttonVariants = {
  hover: { scale: 1.1 },
  tap: { scale: 0.9 }
};

const TvShowCard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { show: shows, showKey, loading } = useTvShowDetails(id);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToHistory } = useWatchHistory();
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } = useWatchLater();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  useEffect(() => {
    if (shows && shows.id) {
      addToHistory({ id: shows.id, title: shows.name || shows.title, poster_path: shows.poster_path, backdrop_path: shows.backdrop_path, vote_average: shows.vote_average, media_type: "tv", overview: shows.overview, release_date: shows.first_air_date });
    }
  }, [shows]);

  if (loading || !shows) return <MediaDetailsSkeleton />;

  const backdropUrl = shows.backdrop_path ? `https://image.tmdb.org/t/p/original${shows.backdrop_path}` : "/placeholder.svg";
  const posterUrl = shows.poster_path ? `https://image.tmdb.org/t/p/w500${shows.poster_path}` : "/placeholder.svg";

  return (
    <section className="py-4">
      <motion.div ref={containerRef} className="relative w-full min-h-[90vh] text-white bg-gray-900 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="absolute z-50 right-4 top-4 sm:right-8 sm:top-8 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-red-500">
          <span className="hidden sm:inline text-sm font-medium">Close</span>
          <span className="text-xl sm:text-base">✕</span>
        </motion.button>

        <motion.div className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 blur-sm" style={{ backgroundImage: `url(${backdropUrl})`, y: parallaxY }} />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 container mx-auto px-6 py-16 flex flex-col md:flex-row items-center md:items-start gap-10">
          <motion.div variants={posterVariants} initial="hidden" animate="visible" className="shrink-0 w-64 md:w-80 lg:w-96 rounded shadow-2xl overflow-hidden">
            <motion.div whileHover={{ scale: 1.05 }} className="rounded shadow-2xl overflow-hidden">
              <ImageWithLoader src={posterUrl} alt={shows.title || shows.name} className="w-48 h-72 rounded shadow-md object-cover aspect-square" />
            </motion.div>
          </motion.div>

          <motion.div variants={contentVariants} initial="hidden" animate="visible" className="flex-1 flex flex-col gap-4 text-center md:text-left">
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-10 items-center justify-center md:justify-start">
              <motion.h1 whileHover={{ scale: 1.02 }} className="text-4xl md:text-6xl font-bold">{shows.name || shows.title}</motion.h1>
              <div className="flex gap-4">
                <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap"
                  onClick={() => { const showId = shows.id || shows.tmdbId; isInWishlist(showId, "tv") ? removeFromWishlist(showId, "tv") : addToWishlist({ id: showId, title: shows.name || shows.title, poster_path: shows.poster_path, vote_average: shows.vote_average, media_type: "tv" }); }}
                  className="text-white rounded-full p-2"
                >
                  <FontAwesomeIcon icon={faHeart} className={isInWishlist(shows.id, "tv") ? "text-red-500" : "text-white"} size="lg" />
                </motion.button>

                <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap"
                  onClick={() => { const showId = shows.id || shows.tmdbId; if (isInWatchLater(showId)) removeFromWatchLater(showId, "tv"); else addToWatchLater({ id: showId, title: shows.name || shows.title, poster_path: shows.poster_path, backdrop_path: shows.backdrop_path, vote_average: shows.vote_average, media_type: "tv", overview: shows.overview, release_date: shows.first_air_date, genres: shows.genres?.map((g) => g.name) }, "tv"); }}
                  className="text-white rounded-full p-2"
                >
                  <FontAwesomeIcon icon={faClock} className={isInWatchLater(shows.id) ? "text-blue-500" : "text-white"} size="lg" />
                </motion.button>

                <div className="text-green-500 p-2" title="Watched"><FontAwesomeIcon icon={faCheck} size="lg" /></div>
              </div>
            </motion.div>

            {shows.tagline && <motion.p variants={itemVariants} className="text-lg text-gray-400 italic mt-2">"{shows.tagline}"</motion.p>}

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-3 items-center mt-2">
              <span className="px-4 py-1 text-yellow-500 font-bold text-md">★ {shows.vote_average ? shows.vote_average.toFixed(1) : "N/A"}</span>
              {shows.first_air_date && <span className="px-3 py-1 text-gray-200 text-sm">{new Date(shows.first_air_date).getFullYear()}</span>}
              {shows.episode_run_time?.[0] && <span className="px-3 py-1 text-gray-200 text-sm">{shows.episode_run_time[0]} min/episode</span>}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-2 text-xs uppercase tracking-wide">
              {shows.genres?.map((g) => <span key={g.id} className="px-3 py-1 text-gray-300">{g.name}</span>)}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              {shows.spoken_languages?.map((lang) => <span key={lang.name} className="px-3 py-1 text-gray-300 text-xs uppercase tracking-wide border border-gray-700 rounded">{lang.english_name}</span>)}
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-2xl mt-4">
              <h3 className="text-xl font-semibold mb-2 text-gray-200">Overview</h3>
              <p className="text-gray-300 leading-relaxed text-lg">{shows.overview || "No overview available."}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-4 items-center justify-center md:justify-start mt-4">
              <TrailerButton movieKey={showKey} />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <CastWindow type="tv" />
      <hr className="bg-linear-to-r from-blue-500 to-purple-500 h-px mx-4 my-8 opacity-75" />
      <CommentBox contentId={String(shows.id)} contentTitle={shows.name || shows.title} contentType="tv" />
      <ReviewWindow type="tv" />
      <hr className="bg-linear-to-r from-blue-500 to-purple-500 h-px mx-4 my-8 opacity-75" />
      <SimilarTvShows />
    </section>
  );
};

export default TvShowCard;