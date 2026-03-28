import { useState, useEffect, useContext } from "react";
import { fetchMoviesByGenre, fetchTvShowsByGenre } from "../services/tmdbApi";
import { AVAILABLE_GENRES } from "../context/UserPreferencesContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { useWishlist } from "../context/WishlistContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useAuth } from "../context/AuthContext";
import UniversalCarousel from "../ui/UniversalCarousel";
import BlurImage from "../ui/BlurImage";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { faClock, faDeleteLeft } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const MOVIE_TO_TV_GENRE_MAP = {
  28: 10759,
  12: 10759,
  35: 35,
  80: 80,
  99: 99,
  18: 18,
  10751: 10751,
  14: 10765,
  36: 36,
  27: 10768,
  10402: 10402,
  9648: 9648,
  10749: 10749,
  878: 10765,
  53: 10768,
  10752: 10768,
  37: 37,
};

const getTvGenreId = (movieGenreId) => {
  return MOVIE_TO_TV_GENRE_MAP[movieGenreId] || movieGenreId;
};

const GenreRow = ({ genreId, genreName, icon }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { watchLater, addToWatchLater, removeFromWatchLater } = useWatchLater();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToHistory } = useWatchHistory();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const pagePromises = [];
        const pagesToFetch = 5;
        
        for (let page = 1; page <= pagesToFetch; page++) {
          pagePromises.push(fetchMoviesByGenre(genreId, page));
          const tvGenreId = getTvGenreId(genreId);
          pagePromises.push(fetchTvShowsByGenre(tvGenreId, page));
        }
        
        const results = await Promise.all(pagePromises);
        
        const combined = [];
        const seen = new Set();
        
        results.forEach((data) => {
          (data.results || []).forEach((item) => {
            const key = `${item.id}-${!item.title ? 'tv' : 'movie'}`;
            if (!seen.has(key)) {
              seen.add(key);
              combined.push(item);
            }
          });
        });
        
        const shuffled = combined.sort(() => Math.random() - 0.5);
        setItems(shuffled);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [genreId]);

  if (items.length === 0 && !loading) {
    return (
      <UniversalCarousel
        title={`${icon} ${genreName}`}
        items={[]}
        loading={false}
        error="No results found"
        renderItem={() => null}
      />
    );
  }

  return (
    <UniversalCarousel
      title={`${icon} ${genreName}`}
      items={items}
      loading={loading}
      error={error}
      renderItem={(item) => {
        const itemMediaType = !item.title ? "tv" : "movie";
        const itemId = item.id;
        
        const isInWL = watchLater.some(w => Number(w.movieId) === Number(itemId));
        const isInWish = wishlist.some(w => Number(w.tmdbId) === Number(itemId) && w.media_type === itemMediaType);

        const handleWatchLaterClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!user) return navigate("/login", { state: { from: `/${itemMediaType}/${itemId}` } });
          if (isInWL) {
            removeFromWatchLater(itemId, itemMediaType);
          } else {
            addToWatchLater({ ...item, movieId: itemId }, itemMediaType);
          }
        };

        const handleWishlistClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!user) return navigate("/login", { state: { from: `/${itemMediaType}/${itemId}` } });
          if (isInWish) {
            removeFromWishlist(itemId, itemMediaType);
          } else {
            addToWishlist({
              tmdbId: itemId,
              title: item.title || item.name,
              poster_path: item.poster_path,
              vote_average: item.vote_average,
              type: itemMediaType,
            });
          }
        };
        
        return (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 260 }}
            className="shrink-0 w-48">
            <Link
              to={item.title ? `/movie/${item.id}` : `/tvshow/${item.id}`}
              onClick={() => addToHistory({
                id: item.id,
                title: item.title || item.name,
                poster_path: item.poster_path,
                vote_average: item.vote_average,
                type: itemMediaType,
              })}
              className="group block">
              <div className="relative w-48">
                <BlurImage
                  src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                  alt={item.title || item.name}
                  className="w-full h-67.5 rounded shadow-md transition-transform duration-300"
                />
                
                <button
                  onClick={handleWatchLaterClick}
                  className="absolute top-2 left-2 bg-black/80 text-white p-2 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                >
                  <FontAwesomeIcon icon={isInWL ? faDeleteLeft : faClock} />
                </button>
                
                <button
                  onClick={handleWishlistClick}
                  className="absolute top-2 right-2 bg-black/80 text-white p-2 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                >
                  <FontAwesomeIcon
                    icon={faHeart}
                    style={{ color: isInWish ? "#FF0000" : "#FFFFFF" }}
                  />
                </button>
                
                <span className="absolute bottom-2 left-2 bg-yellow-500 text-black font-bold text-sm px-3 py-1 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                  ★ {item.vote_average?.toFixed(1) ?? "N/A"}
                </span>
              </div>
              
              <h5 className="mt-2 text-center text-sm truncate text-gray-300 group-hover:text-white">
                {item.title || item.name}
              </h5>
            </Link>
          </motion.div>
        );
      }}
    />
  );
};

const GenreBasedRecommendations = ({ selectedGenres }) => {
  if (!selectedGenres || selectedGenres.length === 0) return null;

  const getGenreInfo = (id) => {
    const genre = AVAILABLE_GENRES.find((g) => g.id === id);
    return genre || { name: "Movies", icon: "🎬" };
  };

  return (
    <div className="genre-based-recs">
      {selectedGenres.slice(0, 6).map((genreId) => {
        const genre = getGenreInfo(genreId);
        return (
          <div key={genreId} className="mb-6">
            <GenreRow 
              genreId={genreId} 
              genreName={genre.name} 
              icon={genre.icon}
            />
          </div>
        );
      })}
    </div>
  );
};

export default GenreBasedRecommendations;
