import { useContext, useState } from "react";
import StarRating from "../components/StarRating";
import { ThemeContext } from "../context/ThemeProvider";
import { useEffect } from "react";

/**
 * CommentItem Component
 * ---------------------
 * Displays a single user comment/review with:
 * - Avatar, username, star rating, date, and text
 * - Edit mode (textarea + rating select)
 * - Save / Cancel actions
 * - Delete button (via onDelete prop)
 *
 * Props:
 * - `comment`: comment object from localStorage (fields include id, user, text, rating, timestamp)
 * - `user`: current logged-in user (for edit/delete permissions)
 * - `onDelete`: function to delete this comment (called with comment.id)
 * - `onUpdate` (optional): callback invoked with updated comment after edit
 */
const CommentItem = ({ comment, user, onDelete, onUpdate }) => {
  const { theme } = useContext(ThemeContext);
  const [editing, setEditing] = useState(false);

  const [editData, setEditData] = useState({
    comment: comment.comment || "",
    rating: comment.rating || 0,
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
    });
  }, [comment]);

  const currentUserId = user?.user?.id || user?.user?._id;
  const commentOwnerId = comment.user?._id || comment.user;
  const isOwner =
    currentUserId &&
    commentOwnerId &&
    String(currentUserId) === String(commentOwnerId);

  return (
    <div
      className={`my-4 p-4 rounded mx-6 shadow ${
        theme === "dark"
          ? "bg-[#1f1c18] text-[#FAFAFA]"
          : "bg-[#cfd3e0] text-[#312F2C]"
      }`}>
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

          {/* Date + (edited) indicator */}
          <span className="pl-10 pt-4 italic text-sm wrap-break-word">
            {comment.timestamp
              ? new Date(comment.timestamp).toLocaleDateString()
              : "Just now"}
          </span>

          {/* Comment text */}
          <p className="pl-10 py-4 text-sm">{comment.comment}</p>

          {/* Edit / Delete buttons (only for owner) */}
          {isOwner && (
            <div className="pl-10 flex justify-between text-sm text-gray-500">
              {/* Simplified check - in a real app we'd compare user IDs properly */}
              {user && comment.user && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setEditing(true)}
                    className="text-blue-600 font-semibold">
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment._id)}
                    className="text-red-600 font-semibold">
                    Delete
                  </button>
                </div>
              )}
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

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded">
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentItem;
