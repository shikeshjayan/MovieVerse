import { useContext, useEffect, useState } from "react";
import { tvReviews } from "../services/tmdbApi";
import { useParams } from "react-router-dom";
import StarRating from "../components/StarRating";
import { ThemeContext } from "../context/ThemeProvider";

const ReviewWindow = () => {
  const { id } = useParams();
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const data = await tvReviews(id, { signal: controller.signal });

        const sortedCast = [...(data ?? [])].sort(
          (a, b) => b.popularity - a.popularity
        );

        setReviews(sortedCast);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Failed to load reviews");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id]);

  if (loading) return <p>Loading cast...</p>;
  if (error) return <p>{error}</p>;
  if (!reviews.length) return <p>No reviews available.</p>;

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
            className={`p-4 shadow rounded m-8 overflow-hidden ${
              theme === "dark"
                ? "bg-[#1f1c18] text-[#FAFAFA]"
                : "bg-[#cfd3e0] text-[#312F2C]"
            }`}
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
            <div className="pl-10 pt-4 italic text-sm">
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
