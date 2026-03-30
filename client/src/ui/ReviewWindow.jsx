import { useContext, useEffect, useState } from "react";
import { movieReviews, tvReviews } from "../services/tmdbApi";
import { useParams } from "react-router-dom";
import StarRating from "../components/StarRating";

const ReviewWindow = ({ type: mediaType }) => {
  const { id } = useParams();
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = mediaType === "tv" ? tvReviews : movieReviews;

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const data = await fetchReviews(id, { signal: controller.signal });
        const sortedReviews = [...(data ?? [])].sort(
          (a, b) => b.popularity - a.popularity
        );
        setReviews(sortedReviews);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Failed to load reviews");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id, fetchReviews]);

  if (loading) return <p className="px-4">Loading reviews...</p>;
  if (error) return <p className="px-4">{error}</p>;
  if (!reviews?.length) return <p className="px-4">No reviews available.</p>;

  return (
    <>
      {reviews.map((review) => {
        const { rating, avatar_path } = review.author_details || {};
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
            <div className="pl-10 pt-4 italic text-sm wrap-break-word">
              {new Date(review.created_at).toLocaleDateString()}
            </div>
            <p className="pl-10 mt-2 text-sm">{review.content}</p>
          </div>
        );
      })}
    </>
  );
};

export default ReviewWindow;
