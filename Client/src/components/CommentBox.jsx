import { useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useReview } from "../context/ReviewContext";
import ConfirmModal from "../ui/ConfirmModal";
import CommentItem from "../ui/CommentItem";
import { ThemeContext } from "../context/ThemeProvider";
import { getMovieReviewsService } from "../services/axiosApi";

/**
 * CommentBox Component
 * Renders a real-time review section connected to MongoDB.
 */
const CommentBox = ({ contentId, contentType }) => {
  const { user } = useAuth();
  const { theme } = useContext(ThemeContext);
  const { addReview, removeReview, hasReviewed, updateReview } = useReview();

  // State
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ text: "", rating: 0 });
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState(null);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  /* ---------------- FETCH COMMENTS ---------------- */
  useEffect(() => {
    const fetchPublicReviews = async () => {
      setLoading(true);
      try {
        const res = await getMovieReviewsService(contentId, contentType);
        // Backend returns reviews with .populate("user")
        setComments(res.data || []);
      } catch (err) {
        // If no reviews found (404), we just show an empty list
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    if (contentId) fetchPublicReviews();
  }, [contentId, contentType]);

  /* ---------------- POST COMMENT ---------------- */
  const postComment = async (e) => {
    e.preventDefault();
    if (!user || !form.text.trim() || form.rating === 0) return;

    try {
      const payload = {
        movieId: contentId,
        media_type: contentType,
        rating: form.rating,
        comment: form.text,
      };

      const newReview = await addReview(payload);

      // Update local UI list
      setComments((prev) => [newReview, ...prev]);
      setForm({ text: "", rating: 0 });
      showError("Review posted successfully");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to post review");
    }
  };

  /* ---------------- DELETE FLOW ---------------- */
  const handleDelete = async () => {
    try {
      await removeReview(deleteId);
      setComments((prev) => prev.filter((c) => c._id !== deleteId));
      showError("Review deleted successfully!");
    } catch (err) {
      showError("Could not delete review");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  // Check if current user already reviewed this movie
  const alreadyReviewed = hasReviewed(contentId, contentType);

  return (
    <section className="p-6">
      <h3
        className="text-xl font-semibold mb-6"
        style={{ color: theme === "dark" ? "#FCFCF7" : "#171717" }}>
        User Reviews
      </h3>

      {/* ERROR/SUCCESS TOAST */}
      {error && (
        <div className="mb-4 p-3 bg-blue-500 text-white rounded animate-pulse">
          {error}
        </div>
      )}

      {/* COMMENT FORM - Only show if logged in AND hasn't reviewed yet */}
      {user && !alreadyReviewed ? (
        <form
          onSubmit={postComment}
          className={`mb-8 space-y-4 p-6 rounded ${
            theme === "dark" ? "text-[#FAFAFA]" : "text-[#312F2C]"
          }`}>
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            className={`w-full p-4 border-b bg-transparent focus:outline-none placeholder:text-[#0064E0] ${
              theme === "dark" ? "text-[#FAFAFA]" : "text-[#312F2C]"
            }`}
            placeholder="Write a review..."
          />

          <div className="flex gap-2">
            <select
              value={form.rating}
              onChange={(e) =>
                setForm({ ...form, rating: Number(e.target.value) })
              }
              className={`p-1 border rounded bg-transparent ${
                theme === "dark" ? "text-[#FAFAFA]" : "text-[#312F2C]"
              }`}>
              <option value={0}>☆</option>
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r} className="text-black">
                  {r} ★
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!form.text.trim() || form.rating === 0}
              className="px-4 py-2 bg-[#0064E0] text-[#FCFCF7] hover:bg-[#0073ff] rounded disabled:bg-gray-400 transition-colors">
              Post Review
            </button>
          </div>
        </form>
      ) : user && alreadyReviewed ? (
        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded italic text-sm text-gray-500">
          You have already submitted a review for this content.
        </div>
      ) : (
        <div className="mb-8 p-4 border border-dashed rounded text-center text-gray-400">
          Please log in to share your review.
        </div>
      )}

      {/* COMMENTS LIST */}
      {loading ? (
        <p className="text-center text-gray-400">Loading reviews...</p>
      ) : comments.length === 0 ? (
        <p className="text-center text-gray-400 py-10">
          No reviews yet. Be the first!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((c) => (
            <CommentItem
              key={c._id}
              comment={c}
              user={user}
              onDelete={() => {
                setDeleteId(c._id);
                setConfirmOpen(true);
              }}
              onUpdate={async (updateData) => {
                try {
                  const res = await updateReview(c._id, updateData);
                  setComments((prev) =>
                    prev.map((x) => (x._id === c._id ? res : x)),
                  );
                  showError("Review updated successfully");
                } catch (error) {
                  showError("Failed to update review");
                }
              }}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Delete Review"
        message="This action will permanently remove your review."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </section>
  );
};

export default CommentBox;
