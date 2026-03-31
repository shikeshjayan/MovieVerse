import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const DashboardCard = ({ item, type, id, onRemove }) => {
  const title = item?.title || item?.name || item?.original_name || "Unknown";
  const routeType = type === "tv" ? "tvshow" : "movie";
  const link = routeType === "tvshow" ? `/tvshow/${id}` : `/movie/${id}`;
  const hasPoster = !!item?.poster_path;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.97 }}
      className="group cursor-pointer"
    >
      <Link to={link} className="block no-underline">
        <div className="relative w-full aspect-2/3 overflow-hidden rounded-lg shadow-md">
          {hasPoster ? (
            <img
              src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.target.src = "/placeholder.svg"; }}
            />
          ) : (
            <img
              src="/placeholder.svg"
              alt={title}
              className="w-full h-full object-cover"
            />
          )}

          {onRemove && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(item);
              }}
              aria-label={`Remove ${title}`}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-red-600 text-white shadow-md z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
            >
              <FontAwesomeIcon icon={faXmark} size="sm" />
            </motion.button>
          )}
        </div>

        <h5 className="mt-2 text-sm text-center truncate text-gray-900 dark:text-blue-200">
          {title}
        </h5>
      </Link>
    </motion.div>
  );
};

export default DashboardCard;
