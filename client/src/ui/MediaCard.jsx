import { Link, useNavigate } from "react-router-dom";
import { useWatchLater } from "../context/WatchLaterContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faClock, faDeleteLeft } from "@fortawesome/free-solid-svg-icons";
import BlurImage from "./BlurImage";

const MediaCard = ({ item, type, onDelete, showDelete = false }) => {
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } = useWatchLater();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isMovie = type === "movie";
  const id = item.id;
  const title = item.title || item.name;
  const link = isMovie ? `/movie/${id}` : `/tvshow/${id}`;

  const isInWatchLaterFlag = isInWatchLater(id);
  const isWishlisted = isInWishlist(id, type);

  const handleWatchLater = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");

    if (isInWatchLaterFlag) {
      removeFromWatchLater(id, type);
    } else {
      addToWatchLater(
        { movieId: Number(id), title, poster_path: item.poster_path, vote_average: item.vote_average },
        type
      );
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");

    if (isWishlisted) {
      removeFromWishlist(id, type);
    } else {
      addToWishlist({ id, title, poster_path: item.poster_path, vote_average: item.vote_average, type });
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(id);
  };

  return (
    <div className="shrink-0 w-32 sm:w-40 md:w-48">
      <Link to={link} className="group block">
        <div className="relative w-full">
          <BlurImage
            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
            alt={title}
            className="w-full aspect-[2/3] rounded shadow-md object-cover"
          />

          {showDelete ? (
            <button
              onClick={handleDelete}
              className="absolute z-10 top-2 left-2 bg-black/80 text-white p-2 rounded opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition"
            >
              <FontAwesomeIcon icon={faDeleteLeft} className="cursor-pointer shadow" />
            </button>
          ) : (
            <button
              onClick={handleWatchLater}
              className="absolute z-10 top-2 left-2 bg-black/80 text-white p-2 rounded opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition"
            >
              <FontAwesomeIcon
                icon={isInWatchLaterFlag ? faDeleteLeft : faClock}
                className="cursor-pointer shadow"
              />
            </button>
          )}

          <button
            onClick={handleWishlist}
            className="absolute z-10 top-2 right-2 bg-black/80 text-white p-2 rounded opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition"
          >
            <FontAwesomeIcon
              icon={faHeart}
              style={{ color: isWishlisted ? "#FF0000" : "#FFFFFF" }}
              className="cursor-pointer shadow"
            />
          </button>

          <span className="absolute bottom-2 left-2 bg-yellow-500 text-black font-bold text-sm px-3 py-1 rounded opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition">
            ★ {item.vote_average?.toFixed(1) ?? "N/A"}
          </span>
        </div>

        <h5 className="mt-2 text-center text-xs sm:text-sm truncate">
          {title}
        </h5>
      </Link>
    </div>
  );
};

export default MediaCard;