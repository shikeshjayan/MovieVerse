import { useEffect, useState } from "react";
import { useReview } from "../context/ReviewContext";
import CommentItem from "../ui/CommentItem";
import ConfirmModal from "../ui/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";


const Myreviews = ({ onReviewCountChange }) => {
  const { user } = useAuth();

  const { reviews, removeReview, updateReview, loading, error } = useReview();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // notify parent when the number of reviews changes
  useEffect(() => {
    if (onReviewCountChange) onReviewCountChange(reviews.length);
  }, [reviews, onReviewCountChange]);

  /* ---------------- DELETE ACTION ---------------- */

  const confirmDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleteError(null);
      await removeReview(deleteId);
    } catch (err) {
      setDeleteError("Failed to delete the review. Please try again.");
    } finally {
      setConfirmOpen(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  if (error) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="p-2 sm:p-6 max-w-4xl mx-auto">
      <header className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold">Your Activity</h2>
          <p className="text-gray-500 text-sm">Manage your published reviews</p>
        </div>
        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
          {reviews.length}
        </span>
      </header>

      {loading ? (
        <div className="flex flex-col items-center py-12 gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-400 animate-pulse">
            Synchronizing reviews...
          </p>
        </div>
      ) : reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 text-lg">No reviews found yet.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {reviews.map((comment) => (
              <motion.div
                key={comment._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}>
                <CommentItem
                  comment={comment}
                  user={user}
                  onDelete={() => confirmDelete(comment._id)}
                  onUpdate={async (updatedFields) => {
                    try {
                      await updateReview(comment._id, updatedFields);
                    } catch (error) {
                      console.error("Update failed in MyReviews:", error);
                    }
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Delete Review"
        message="Are you sure you want to permanently delete this review? This cannot be undone."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </section>
  );
};

export default Myreviews;
