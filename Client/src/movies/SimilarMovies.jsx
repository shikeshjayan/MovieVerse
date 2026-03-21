import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { similarMovies } from "../services/tmdbApi";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { faClock, faDeleteLeft } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

import BlurImage from "../ui/BlurImage";
import UniversalCarousel from "../ui/UniversalCarousel";

const SimilarMovies = () => {
  const { id } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { addToHistory } = useWatchHistory();
  const { watchLater, addToWatchLater, removeFromWatchLater, isInWatchLater } =
    useWatchLater();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  // ---------------- Fetch Similar Movies ----------------
  useEffect(() => {
    let isMounted = true;
    const fetchSimilar = async () => {
      try {
        setLoading(true);
        const data = await similarMovies(id);
        if (isMounted) setMovies(data || []);
      } catch (err) {
        console.error("Failed to fetch similar movies", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSimilar();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <UniversalCarousel
      title="You might also like"
      items={movies}
      loading={loading}
      renderItem={(movie) => {
        const isInWatchLaterFlag = isInWatchLater(movie.id);
        const isWishlisted = isInWishlist(movie.id, "movie");

        return (
          <motion.div
            key={movie.id}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 260 }}
            className="shrink-0">
            <Link
              to={`/movie/${movie.id}`}
              onClick={() =>
                addToHistory({
                  id: movie.id,
                  title: movie.title,
                  poster_path: movie.poster_path,
                  vote_average: movie.vote_average,
                  type: "movie",
                })
              }
              className="group block">
              <div className="relative w-48">
                <BlurImage
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-67.5 rounded shadow-md"
                />

                {/* Watch Later */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!user) return navigate("/login");

                    isInWatchLaterFlag
                      ? removeFromWatchLater(movie.id, "movie")
                      : addToWatchLater(movie, "movie");
                  }}
                  className="absolute top-2 left-2 bg-black/80 text-white p-2 rounded
                  opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                  <FontAwesomeIcon
                    icon={isInWatchLaterFlag ? faDeleteLeft : faClock}
                  />
                </button>

                {/* Wishlist */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!user) return navigate("/login");

                    isWishlisted
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
                    style={{ color: isWishlisted ? "#FF0000" : "#FFFFFF" }}
                  />
                </button>

                {/* Rating */}
                <span
                  className="absolute bottom-2 left-2 bg-yellow-500 text-black
                  font-bold text-sm px-3 py-1 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                  ★ {movie.vote_average?.toFixed(1) ?? "N/A"}
                </span>
              </div>

              <h5 className="mt-2 text-center text-sm truncate w-48 wrap-break-word">
                {movie.title}
              </h5>
            </Link>
          </motion.div>
        );
      }}
    />
  );
};

export default SimilarMovies;
