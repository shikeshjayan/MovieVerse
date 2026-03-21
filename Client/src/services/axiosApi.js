import apiClient from "./apiClient";

// --- Authentication Services ---
export const registerUser = async (userData) => {
  const { data } = await apiClient.post("/auth/register", userData);
  if (data.token) localStorage.setItem("token", data.token);
  return data;
};

export const loginUser = async (email, password) => {
  const { data } = await apiClient.post("/auth/login", { email, password });
  if (data.token) localStorage.setItem("token", data.token);
  return data;
};

export const getProfile = async () => {
  const { data } = await apiClient.get("/v1/auth/profile");
  return data;
};

export const logoutUser = async () => {
  try {
    await apiClient.post("/v1/auth/logout");
  } finally {
    localStorage.removeItem("token");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
};

// --- Watchlist Services (Removed - use History instead) ---

// --- Favorite Services ---
export const getFavorites = async () => {
  const { data } = await apiClient.get("/v1/favorites");
  return data;
};

export const addToFavorites = async (movie) => {
  const { data } = await apiClient.post("/v1/favorites/add", movie);
  return data;
};

export const removeFromFavorites = async (movieId) => {
  const { data } = await apiClient.delete(`/v1/favorites/${movieId}`);
  return data;
};

// --- Wishlist Services ---
export const getWishlist = async () => {
  console.log("API: Fetching wishlist...");
  const { data } = await apiClient.get("/wishlist");
  console.log("API: Wishlist response:", data);
  return data;
};

export const addToWishlist = async (movie) => {
  console.log("API: Adding to wishlist:", movie);
  const payload = {
    ...movie,
    tmdbId: movie.tmdbId || movie.id,
  };
  const { data } = await apiClient.post("/wishlist", payload);
  return data;
};

export const clearWishlist = async () => {
  const { data } = await apiClient.delete("/wishlist/clear");
  return data;
};

export const removeFromWishlist = async (tmdbId, type = "movie") => {
  console.log(`API: Removing ${tmdbId} from wishlist...`);
  const { data } = await apiClient.delete(`/wishlist/${tmdbId}?type=${type}`);
  return data;
};

export const checkWishlist = async (movieId) => {
  const { data } = await apiClient.get(`/wishlist/check/${movieId}`);
  return data;
};
// --- Watch Later Services ---
export const getWatchLaterService = async () => {
  const { data } = await apiClient.get("/watchlater");
  return data;
};

export const addToWatchLaterService = async (movie) => {
  const { data } = await apiClient.post("/watchlater/add", movie);
  return data;
};

export const removeFromWatchLaterService = async (movieId, type) => {
  const url = type
    ? `/watchlater/${movieId}?type=${type}`
    : `/watchlater/${movieId}`;
  const { data } = await apiClient.delete(url);
  return data;
};

export const clearWatchLaterService = async () => {
  const { data } = await apiClient.delete("/watchlater/clear");
  return data;
};

// --- Review Services (backend) ---
export const getMyReviewsService = async () => {
  const { data } = await apiClient.get("/reviews/my-reviews");
  return data;
};

export const getMovieReviewsService = async (movieId, type = "movie") => {
  const { data } = await apiClient.get(`/reviews/${movieId}?type=${type}`);
  return data;
};

export const addReviewService = async (review) => {
  const { data } = await apiClient.post("/reviews", review);
  return data;
};

export const updateReviewService = async (reviewId, updates) => {
  const { data } = await apiClient.patch(`/reviews/${reviewId}`, updates);
  return data;
};

export const deleteReviewService = async (reviewId) => {
  const { data } = await apiClient.delete(`/reviews/${reviewId}`);
  return data;
};

// --- User Services (admin) ---
export const getAllUsersService = async () => {
  const { data } = await apiClient.get("/users");
  return data;
};

export const updateUserService = async (userId, updates) => {
  const { data } = await apiClient.put(`/users/${userId}`, updates);
  return data;
};

export const deleteUserService = async (userId) => {
  const { data } = await apiClient.delete(`/users/${userId}`);
  return data;
};
// --- User Services (profile updates) ---
export const updateProfileService = async (updates) => {
  const { data } = await apiClient.patch("/users/update-profile", updates);
  return data;
};

// --- Watch History Services ---
export const getHistory = async () => {
  console.log("API: Fetching history...");
  const { data } = await apiClient.get("/history");
  console.log("API: History response:", data);
  return data;
};

export const addToHistory = async (movie) => {
  console.log("API addToHistory: Sending request to /history with:", movie);
  try {
    const response = await apiClient.post("/history", movie);
    console.log("API addToHistory: Full response:", response);
    console.log("API addToHistory: Response data:", response.data);
    return response.data;
  } catch (error) {
    console.error("API addToHistory: Error:", error);
    console.error("API addToHistory: Error response:", error.response);
    throw error;
  }
};

export const removeHistoryItem = async (movieId, type = "movie") => {
  const { data } = await apiClient.delete(`/history/${movieId}?type=${type}`);
  return data;
};

export const clearHistory = async () => {
  const { data } = await apiClient.delete("/history/clear");
  return data;
};

// --- Recommendation Services ---
export const getRecommendationsService = async (
  userId,
  type = null,
  mode = "personalized",
) => {
  console.log("🌐 API call for userId:", userId);
  try {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (mode) params.append("mode", mode);
    const queryString = params.toString();
    const url = queryString
      ? `/recommendations?${queryString}`
      : "/recommendations";
    const { data } = await apiClient.get(url);
    console.log("📦 Raw API response:", data);
    return data;
  } catch (err) {
    console.error(
      "[Recommendations] API error:",
      err.response?.data?.message || err.message,
    );
    return { source: "error", results: [] };
  }
};
