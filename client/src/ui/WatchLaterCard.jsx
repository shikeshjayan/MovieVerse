import React from "react";
import ImageWithLoader from "./ImageWithLoader";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";

/**
 * WatchLaterCard Component
 * ------------------------
 * A card for a movie in the "Watch Later" list.
 *
 * Features:
 * - Displays movie poster with loader
 * - Shows rating badge on hover
 * - Clickable card (optional details navigation)
 * - Remove button (X icon) to delete from watch later
 *
 * Props:
 * - `movie` (object): Movie object from TMDB (must have poster_path, title/name, vote_average)
 * - `onClick` (function): Called when the card is clicked (e.g., navigate to details)
 * - `onRemove` (function): Called when the remove button is clicked
 */
const WatchLaterCard = ({ movie, onClick, onRemove }) => {
  return (
    <div
      className="watch-later-card relative group w-50 cursor-pointer"
      onClick={onClick} // Optional: open movie details when card is clicked
    >
      {/* Movie poster with loader */}
      <ImageWithLoader
        src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
        alt={movie.title || movie.name}
        className="w-50 h-75 rounded shadow-md object-cover"
      />

      {/* Remove button (X icon) */}
      <motion.button
        whileHover={{ rotate: 12 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering card click
          onRemove && onRemove(); // Safely call onRemove if provided
        }}
        className="absolute top-2 right-2
                   w-7 h-7 flex items-center justify-center
                   rounded-full bg-red-600 text-white
                   shadow-md z-20"
        aria-label="Remove from Watch Later"
      >
        <FontAwesomeIcon icon={faXmark} size="sm" />
      </motion.button>

      {/* Rating badge (shown on hover) */}
      <span className="absolute top-2 left-2 bg-yellow-500 text-black font-bold text-sm px-3 py-1 rounded opacity-0 group-hover:opacity-100 z-10">
        ★ {movie.vote_average?.toFixed(1) ?? "N/A"}
      </span>

      {/* Movie title */}
      <h5 className="w-50 px-2 text-center mt-2">
        {movie.title || movie.name}
      </h5>
    </div>
  );
};

export default WatchLaterCard;
