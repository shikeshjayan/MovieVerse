import { useContext, useState } from "react";
import StarRating from "../components/StarRating";
import { ThemeContext } from "../context/ThemeProvider";
import { useEffect } from "react";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { toast } from "sonner";
import { ToastMessages } from "../utils/toastConfig";

const CommentItem = ({
  comment,
  user,
  onDelete,
  onUpdate,
  onLikeDislike,
  onToggleSpoiler,
}) => {
  const { theme } = useContext(ThemeContext);
  const [editing, setEditing] = useState(false);
  const [showFullComment, setShowFullComment] = useState(false);

  const [editData, setEditData] = useState({
    comment: comment.comment || "",
    rating: comment.rating || 0,
    spoiler: comment.spoiler || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editData.comment.trim() || editData.rating === 0) return;

    setSaving(true);
    try {
      if (onUpdate) {
        await onUpdate({
          comment: editData.comment,
          rating: editData.rating,
          spoiler: editData.spoiler,
        });
      }
      setEditing(false);
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setEditData({
      comment: comment.comment || "",
      rating: comment.rating || 0,
      spoiler: comment.spoiler || false,
    });
    setShowFullComment(!comment.spoiler);
  }, [comment]);

  const currentUserId = user?.id || user?._id;
  const commentOwnerId = comment.user?._id || comment.user;
  const isOwner =
    currentUserId &&
    commentOwnerId &&
    String(currentUserId) === String(commentOwnerId);

  const hasLiked = comment.likedBy?.includes(currentUserId);
  const hasDisliked = comment.dislikedBy?.includes(currentUserId);

  const handleLike = () => {
    if (!user) {
      toast.error(ToastMessages.USER_ACTIONS.LIKE_ERROR);
      return;
    }
    onLikeDislike?.(comment._id, hasLiked ? "unlike" : "like");
  };

  const handleDislike = () => {
    if (!user) {
      toast.error(ToastMessages.USER_ACTIONS.DISLIKE_ERROR);
      return;
    }
    onLikeDislike?.(comment._id, hasDisliked ? "undislike" : "dislike");
  };

  const handleToggleSpoiler = () => {
    if (isOwner) {
      onToggleSpoiler?.(comment._id);
    }
  };

  const truncatedComment =
    comment.comment?.length > 150 && !showFullComment
      ? comment.comment?.slice(0, 150) + "..."
      : comment.comment;

  return (
    <div
      className="my-4 p-4 rounded mx-6 shadow bg-[#cfd3e0] text-[#312F2C] dark:bg-[#1f1c18] dark:text-[#FAFAFA]"
    >
      {!editing ? (
        <>
          {/* Header: Avatar, username, rating */}
          <div className="flex flex-col items-center gap-2 mb-4 lg:flex-row lg:justify-between lg:items-center lg:gap-0">
            <div className="md:pl-10 flex justify-center lg:justify-start items-center gap-3">
              <img
                src={
                  comment.user?.avatar_path
                    ? comment.user.avatar_path.startsWith("/")
                      ? `https://image.tmdb.org/t/p/w45${comment.user.avatar_path}`
                      : comment.user.avatar_path
                    : "/avatar.png"
                }
                alt={comment.user?.name || "Unknown"}
                onError={(e) => {
                  e.target.src = "/avatar.png";
                }}
                className="w-10 h-10 object-cover rounded-full border-2"
              />
            </div>
            <h4 className="font-medium">{comment.user?.name || "Unknown"}</h4>
            <div>
              <StarRating value={comment.rating} />
            </div>
          </div>

          {/* Date + Spoiler indicator */}
          <div className="pl-10 flex items-center gap-2 pt-4 italic text-sm">
            <span>
              {comment.timestamp
                ? new Date(comment.timestamp).toLocaleDateString()
                : "Just now"}
            </span>
            {comment.spoiler && (
              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-semibold">
                Spoiler
              </span>
            )}
          </div>

          {/* Comment text */}
          <div className="pl-10 py-4 text-sm">
            {comment.spoiler && !showFullComment ? (
              <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded text-center">
                <p className="text-yellow-600 dark:text-yellow-400 font-medium mb-2">
                  This review contains spoilers
                </p>
                <button
                  onClick={() => setShowFullComment(true)}
                  className="text-blue-600 hover:underline text-sm font-semibold"
                >
                  Show anyway
                </button>
              </div>
            ) : (
              <p className="wrap-break-word">{truncatedComment}</p>
            )}
            {comment.comment?.length > 150 && showFullComment && (
              <button
                onClick={() => setShowFullComment(false)}
                className="text-blue-600 hover:underline text-sm mt-1"
              >
                Show less
              </button>
            )}
          </div>

          {/* Like/Dislike buttons */}
          <div className="pl-10 flex items-center gap-4 mb-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-sm transition-colors ${
                hasLiked
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              <FaThumbsUp size={14} />
              <span>{comment.likes || 0}</span>
            </button>
            <button
              onClick={handleDislike}
              className={`flex items-center gap-1 text-sm transition-colors ${
                hasDisliked
                  ? "text-red-600"
                  : "text-gray-500 hover:text-red-600"
              }`}
            >
              <FaThumbsDown size={14} />
              <span>{comment.dislikes || 0}</span>
            </button>
          </div>

          {/* Edit / Delete buttons (only for owner) */}
          {isOwner && (
            <div className="pl-10 flex gap-4 text-sm">
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 font-semibold hover:underline">
                Edit
              </button>
              <button
                onClick={() => onDelete(comment._id)}
                className="text-red-600 font-semibold hover:underline">
                Delete
              </button>
            </div>
          )}
        </>
      ) : (
        /* Edit mode */
        <div className="space-y-4">
          <textarea
            value={editData.comment}
            onChange={(e) =>
              setEditData({ ...editData, comment: e.target.value })
            }
            className="w-full p-4 border rounded"
          />

          <select
            value={editData.rating}
            onChange={(e) =>
              setEditData({ ...editData, rating: Number(e.target.value) })
            }
            className="p-2 border rounded">
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>
                {r} ⭐
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editData.spoiler}
              onChange={(e) =>
                setEditData({ ...editData, spoiler: e.target.checked })
              }
              className="w-4 h-4"
            />
            <span className="text-sm">Contains spoilers</span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentItem;
