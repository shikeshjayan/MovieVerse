import { useEffect, useState } from "react";
import { useReview } from "../context/ReviewContext";
import CommentItem from "../ui/CommentItem";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useConfirmation } from "../hooks/useConfirmation";
import EmptyState from "../ui/EmptyState";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "sonner";
import { ToastMessages } from "../utils/toastConfig";
import {
  toggleSpoilerService,
  likeDislikeReviewService,
} from "../services/axiosApi";

const Myreviews = ({ onReviewCountChange }) => {
  const { user } = useAuth();
  const { reviews, removeReview, updateReview, loading, error } = useReview();
  const { isOpen, type, openSingle, openClear, close } = useConfirmation();

  const [localReviews, setLocalReviews] = useState([]);
  const [pendingReview, setPendingReview] = useState(null);

  useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);

  useEffect(() => {
    if (onReviewCountChange) onReviewCountChange(localReviews.length);
  }, [localReviews, onReviewCountChange]);

  const confirmRemove = () => {
    if (type === "single" && pendingReview) {
      removeReview(pendingReview._id);
      toast.success(ToastMessages.REVIEWS.DELETE_SUCCESS);
    }
    if (type === "clear") {
      localReviews.forEach((r) => removeReview(r._id));
      toast.success(ToastMessages.REVIEWS.DELETE_SUCCESS);
    }
    close();
    setPendingReview(null);
  };

  const handleDelete = (review) => {
    setPendingReview(review);
    openSingle(review._id);
  };

  const handleLikeDislike = async (reviewId, action) => {
    try {
      const res = await likeDislikeReviewService(reviewId, action);
      setLocalReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                likes: res.data.likes,
                dislikes: res.data.dislikes,
                likedBy: res.data.likedBy,
                dislikedBy: res.data.dislikedBy,
              }
            : r
        )
      );
      toast.success(ToastMessages.REVIEWS.REACTION_SUCCESS);
    } catch {
      toast.error(ToastMessages.REVIEWS.REACTION_ERROR);
    }
  };

  const handleToggleSpoiler = async (reviewId) => {
    try {
      const res = await toggleSpoilerService(reviewId);
      setLocalReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, spoiler: res.data.spoiler } : r
        )
      );
      toast.success(res.data.spoiler ? ToastMessages.REVIEWS.SPOILER_MARKED : ToastMessages.REVIEWS.SPOILER_UNMARKED);
    } catch {
      toast.error(ToastMessages.REVIEWS.SPOILER_ERROR);
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center rounded-lg border text-red-500 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800">
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 rounded-full animate-spin border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400"></div>
        <p className="mt-4 text-gray-400 dark:text-blue-300 animate-pulse">
          Synchronizing reviews...
        </p>
      </div>
    );
  }

  if (!localReviews.length) {
    return (
      <EmptyState
        icon={faPen}
        title="No reviews yet"
        description="Your published reviews will appear here"
        actionLabel="Browse Movies"
        actionLink="/"
      />
    );
  }

  return (
    <section className="flex flex-col gap-4 px-4">
      <div className="flex items-center justify-between">
        <h4 className="popular-movies md:text-3xl text-gray-900 dark:text-blue-100">My Reviews</h4>
        <button onClick={openClear} title="Clear all reviews">
          <FontAwesomeIcon icon={faTrash} size="lg" className="text-red-600 hover:text-red-700" />
        </button>
      </div>

      <div className="space-y-4">
        {localReviews.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            user={user}
            onDelete={() => handleDelete(comment)}
            onUpdate={async (updatedFields) => {
              try {
                await updateReview(comment._id, updatedFields);
                toast.success(ToastMessages.REVIEWS.UPDATE_SUCCESS);
              } catch (error) {
                console.error("Update failed:", error);
                toast.error(ToastMessages.REVIEWS.UPDATE_ERROR);
              }
            }}
            onLikeDislike={handleLikeDislike}
            onToggleSpoiler={handleToggleSpoiler}
          />
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              {type === "clear" ? "Clear all reviews?" : "Delete review"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {type === "clear"
                ? "This will permanently delete all your reviews."
                : "This action cannot be undone."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  close();
                  setPendingReview(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {type === "clear" ? "Clear All" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Myreviews;
