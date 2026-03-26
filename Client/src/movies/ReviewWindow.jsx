import { useContext, useEffect, useState } from "react";
import { movieReviews } from "../services/tmdbApi";
import { useParams } from "react-router-dom";
import StarRating from "../components/StarRating";
import { ThemeContext } from "../context/ThemeProvider";

/**
 * ReviewWindow Component
 * --------------------------------------------------
 * Fetches and displays reviews for a specific movie.
 * Features:
 * - Dark/light theme support
 * - Star rating visualization
 * - Proper error/loading handling
 * - Responsive layout
 */
const ReviewWindow = () => {
  const { id } = useParams(); // Movie ID from URL
  const { theme } = useContext(ThemeContext);

  const [reviews, setReviews] = useState(null); // Stores fetched reviews
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // ---------------- Fetch reviews ----------------
  useEffect(() => {
    const controller = new AbortController(); // For canceling fetch on unmount

    (async () => {
      try {
        setLoading(true); // Start loading
        const data = await movieReviews(id, { signal: controller.signal });

        // Sort reviews by popularity descending
        const sortedReviews = [...(data ?? [])].sort(
          (a, b) => b.popularity - a.popularity
        );

        setReviews(sortedReviews);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Failed to load reviews");
        }
      } finally {
        setLoading(false); // Stop loading
      }
    })();

    return () => controller.abort(); // Cleanup on unmount
  }, [id]);

  // ---------------- Render states ----------------
  if (loading) return <p className="px-4">Loading reviews...</p>;
  if (error) return <p className="px-4">{error}</p>;
  if (!reviews.length) return <p className="px-4">No reviews available.</p>;

  // ---------------- Review cards ----------------
  return (
    <>
      {reviews.map((review) => {
        const { rating, avatar_path } = review.author_details || {};

        // Determine avatar URL
        const avatarUrl = avatar_path
          ? avatar_path.startsWith("/") && !avatar_path.startsWith("/http")
            ? `https://image.tmdb.org/t/p/w45${avatar_path}`
            : avatar_path.substring(1)
          : "/avatar.png";

        return (
          <div
            key={review.id}
            className="p-4 rounded shadow m-8 overflow-hidden bg-[#cfd3e0] text-[#312F2C] dark:bg-[#1f1c18] dark:text-[#FAFAFA]"
          >
            {/* Header: Avatar, Author, Star Rating */}
            <div className="flex flex-col lg:flex-row items-center justify-between px-10">
              <img
                src={avatarUrl}
                alt={review.author}
                onError={(e) => {
                  e.target.src = "/avatar.png";
                }}
                className="w-10 h-10 object-cover rounded-full border-2"
              />
              <h4 className="font-medium">{review.author}</h4>
              <StarRating value={rating ? rating / 2 : 0} />
            </div>

            {/* Review date */}
            <div className="pl-10 pt-4 italic text-sm wrap-break-word">
              {new Date(review.created_at).toLocaleDateString()}
            </div>

            {/* Review content */}
            <p className="pl-10 mt-2 text-sm">{review.content}</p>
          </div>
        );
      })}
    </>
  );
};

export default ReviewWindow;
