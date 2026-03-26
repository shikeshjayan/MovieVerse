import { useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useReview } from "../context/ReviewContext";
import ConfirmModal from "../ui/ConfirmModal";
import CommentItem from "../ui/CommentItem";
import { ThemeContext } from "../context/ThemeProvider";
import {
  getMovieReviewsService,
  toggleSpoilerService,
  likeDislikeReviewService,
} from "../services/axiosApi";
import { toast } from "sonner";
import { ToastMessages } from "../utils/toastConfig";

const CommentBox = ({ contentId, contentType }) => {
  const { user } = useAuth();
  const { theme } = useContext(ThemeContext);
  const { addReview, removeReview, hasReviewed, updateReview } = useReview();

  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ text: "", rating: 0, spoiler: false });
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [sortBy, setSortBy] = useState("latest");

  useEffect(() => {
    const fetchPublicReviews = async () => {
      setLoading(true);
      try {
        const res = await getMovieReviewsService(contentId, contentType, sortBy);
        setComments(res.data || []);
      } catch {
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    if (contentId) fetchPublicReviews();
  }, [contentId, contentType, sortBy]);

  const postComment = async (e) => {
    e.preventDefault();
    if (!user || !form.text.trim() || form.rating === 0) return;

    try {
      const payload = {
        movieId: contentId,
        media_type: contentType,
        rating: form.rating,
        comment: form.text,
        spoiler: form.spoiler,
      };

      const newReview = await addReview(payload);

      setComments((prev) => [newReview, ...prev]);
      setForm({ text: "", rating: 0, spoiler: false });
      toast.success(ToastMessages.REVIEWS.POST_SUCCESS);
    } catch (err) {
      toast.error(err.response?.data?.message || ToastMessages.REVIEWS.POST_ERROR);
    }
  };

  const handleDelete = async () => {
    try {
      await removeReview(deleteId);
      setComments((prev) => prev.filter((c) => c._id !== deleteId));
      toast.success(ToastMessages.REVIEWS.DELETE_SUCCESS);
    } catch {
      toast.error(ToastMessages.REVIEWS.DELETE_ERROR);
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleLikeDislike = async (reviewId, action) => {
    try {
      const res = await likeDislikeReviewService(reviewId, action);
      setComments((prev) =>
        prev.map((c) =>
          c._id === reviewId
            ? {
                ...c,
                likes: res.data.likes,
                dislikes: res.data.dislikes,
                likedBy: res.data.likedBy,
                dislikedBy: res.data.dislikedBy,
              }
            : c
        )
      );
    } catch {
      toast.error(ToastMessages.REVIEWS.REACTION_ERROR);
    }
  };

  const handleToggleSpoiler = async (reviewId) => {
    try {
      const res = await toggleSpoilerService(reviewId);
      setComments((prev) =>
        prev.map((c) => (c._id === reviewId ? { ...c, spoiler: res.data.spoiler } : c))
      );
      toast.success(res.data.spoiler ? ToastMessages.REVIEWS.SPOILER_MARKED : ToastMessages.REVIEWS.SPOILER_UNMARKED);
    } catch {
      toast.error(ToastMessages.REVIEWS.SPOILER_ERROR);
    }
  };

  const alreadyReviewed = hasReviewed(contentId, contentType);

  return (
    <section className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3
          className="text-xl font-semibold text-[#171717] dark:text-[#FCFCF7]"
        >
          User Reviews
        </h3>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 rounded border text-sm bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="latest">Latest</option>
            <option value="top">Top Rated</option>
          </select>
        </div>
      </div>

      {/* COMMENT FORM */}
      {user && !alreadyReviewed ? (
        <form
          onSubmit={postComment}
          className="mb-8 space-y-4 p-6 rounded text-[#312F2C] dark:text-[#FAFAFA]"
        >
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            className="w-full p-4 border-b bg-transparent focus:outline-none placeholder:text-[#0064E0] text-[#312F2C] dark:text-[#FAFAFA]"
            placeholder="Write a review..."
          />

          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={form.rating}
              onChange={(e) =>
                setForm({ ...form, rating: Number(e.target.value) })
              }
              className="p-1 border rounded bg-transparent text-[#312F2C] dark:text-[#FAFAFA]"
            >
              <option value={0}>☆</option>
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r} className="text-black">
                  {r} ★
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.spoiler}
                onChange={(e) =>
                  setForm({ ...form, spoiler: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm">Contains spoilers</span>
            </label>

            <button
              type="submit"
              disabled={!form.text.trim() || form.rating === 0}
              className="px-4 py-2 bg-[#0064E0] text-[#FCFCF7] hover:bg-[#0073ff] rounded disabled:bg-gray-400 transition-colors"
            >
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
                    prev.map((x) => (x._id === c._id ? { ...x, ...res } : x))
                  );
                  toast.success(ToastMessages.REVIEWS.UPDATE_SUCCESS);
                } catch {
                  toast.error(ToastMessages.REVIEWS.UPDATE_ERROR);
                }
              }}
              onLikeDislike={handleLikeDislike}
              onToggleSpoiler={handleToggleSpoiler}
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
