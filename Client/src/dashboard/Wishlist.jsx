import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useWishlist } from "../context/WishlistContext";
import ConfirmModal from "../ui/ConfirmModal";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";

/**
 * Wishlist Component
 * --------------------------------------------------
 * - Displays wishlist items in a responsive grid
 * - Click card to navigate to movie/TV show
 * - Animated card lift on hover
 * - Animated remove button
 */
const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  if (!wishlist.length) {
    return (
      <div className="flex flex-col items-center justify-center mt-24 text-gray-400">
        <p className="text-lg">Your wishlist is empty ❤️</p>
        <p className="text-sm mt-2">Add movies or TV shows to see them here</p>
      </div>
    );
  }

  const handleRemoveClick = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (openModal) return;
    setSelectedItem(item);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setSelectedItem(null);
  };

  const confirmRemove = () => {
    if (!selectedItem) return;

    console.log("Selected Item Object:", selectedItem);

    const id = selectedItem.tmdbId || selectedItem.id;
    const type = selectedItem.media_type || selectedItem.type || "movie";

    if (!id) {
      console.error("Error: ID is undefined. Check your data structure.");
      return;
    }

    removeFromWishlist(id, type);
    setOpenModal(false);
  };

  return (
    <>
      <section className="p-8">
        <h4 className="popular-movies md:text-3xl mb-4">My Wishlist</h4>

        {/* Responsive Grid of Wishlist Items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {wishlist.map((item) => {
            const title =
              item?.title || item?.name || item?.original_name || "Unknown";
            const routeType = item.media_type === "tv" ? "tvshow" : "movie";
            const tmdbId = item.tmdbId || item.id;

            return (
              <motion.div
                key={`${tmdbId}-${routeType}`}
                role="button"
                tabIndex={0}
                aria-label={`Go to ${title}`}
                onClick={() =>
                  navigate(
                    routeType === "movie"
                      ? `/movie/${tmdbId}`
                      : `/tvshow/${tmdbId}`,
                  )
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  navigate(
                    item.type === "movie"
                      ? `/movie/${item.id}`
                      : `/tvshow/${item.id}`,
                  )
                }
                // Card hover animation
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.97 }}
                className="group cursor-pointer">
                {/* Poster Container */}
                <div className="relative w-full aspect-2/3 overflow-hidden rounded-lg shadow-md">
                  <img
                    src={
                      item.poster_path
                        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                        : "/over.jpg"
                    }
                    alt={title}
                    onError={(e) => {
                      e.target.src = "/over.jpg";
                    }}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />

                  {/* Animated Remove Button */}
                  <motion.button
                    onClick={(e) => handleRemoveClick(e, item)}
                    whileHover={{ scale: 1.2, rotate: 15 }}
                    whileTap={{ scale: 0.9, rotate: 0 }}
                    aria-label={`Remove ${title} from wishlist`}
                    className="
                      absolute top-2 right-2
                      w-7 h-7 flex items-center justify-center
                      rounded-full bg-red-600 text-white
                      shadow-md z-20
                    ">
                    <FontAwesomeIcon icon={faXmark} size="sm" />
                  </motion.button>
                </div>

                {/* Title */}
                <h5 className="mt-2 text-sm text-center truncate">{title}</h5>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={openModal}
        title="Remove from wishlist"
        message="This action cannot be undone."
        onCancel={closeModal}
        onConfirm={confirmRemove}
      />
    </>
  );
};

export default Wishlist;
