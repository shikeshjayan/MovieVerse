import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  getMyReviewsService,
  addReviewService,
  updateReviewService,
  deleteReviewService,
} from "../services/axiosApi";

const ReviewContext = createContext(null);

export const ReviewProvider = ({ children }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // load user's reviews from backend when auth state changes
  useEffect(() => {
    if (!user) {
      setReviews([]);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getMyReviewsService();
        // service returns { success, total, data }
        setReviews(res.data || []);
      } catch (err) {
        console.error("Failed to fetch my reviews", err);
        setError("Could not load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  // add review locally and optionally on server
  const addReview = async (review) => {
    try {
      const res = await addReviewService(review);
      setReviews((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      console.error("Failed to add review", err);
      throw err;
    }
  };

  const updateReview = async (reviewId, updates) => {
    try {
      const res = await updateReviewService(reviewId, updates);
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? res.data : r)),
      );
      return res.data;
    } catch (err) {
      console.error("Failed to update review", err);
      throw err;
    }
  };

  const removeReview = async (reviewId) => {
    try {
      await deleteReviewService(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      console.error("Failed to remove review", err);
      throw err;
    }
  };

  const hasReviewed = (movieId, media_type) => {
    return reviews.some(
      (r) =>
        Number(r.movieId) === Number(movieId) && r.media_type === media_type,
    );
  };

  const getReview = (movieId, media_type) => {
    return (
      reviews.find(
        (r) =>
          Number(r.movieId) === Number(movieId) && r.media_type === media_type,
      ) || null
    );
  };

  const clearReviews = () => setReviews([]);

  return (
    <ReviewContext.Provider
      value={{
        reviews,
        loading,
        error,
        addReview,
        updateReview,
        removeReview,
        hasReviewed,
        getReview,
        clearReviews,
        reviewCount: reviews.length,
      }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReview must be used inside ReviewProvider");
  }
  return context;
};
