import { toast } from "sonner";

export const ToastMessages = {
  AUTH: {
    LOGIN_LOADING: "Signing you in...",
    LOGIN_SUCCESS: (name) => `Welcome back, ${name}!`,
    LOGIN_ERROR: "Invalid email or password. Please try again.",
    REGISTER_LOADING: "Creating your account...",
    REGISTER_SUCCESS: "Account created successfully! Redirecting to login...",
    REGISTER_ERROR: "Registration failed. Please try again.",
    LOGOUT_LOADING: "Signing you out...",
    LOGOUT_SUCCESS: "Signed out successfully!",
    LOGOUT_ERROR: "Failed to sign out. Please try again.",
    FORGOT_PASSWORD_ERROR: "Please enter your email address first",
    USERNAME_UPDATE_LOADING: "Updating username...",
    USERNAME_UPDATE_SUCCESS: "Username updated successfully!",
    USERNAME_UPDATE_ERROR: "Failed to update username",
    PASSWORD_UPDATE_LOADING: "Updating password...",
    PASSWORD_UPDATE_SUCCESS: "Password updated successfully!",
    PASSWORD_UPDATE_ERROR: "Failed to update password",
  },
  WATCH_LATER: {
    ADD_SUCCESS: (title) => `${title} added to Watch Later`,
    REMOVE_SUCCESS: (title) => `${title} removed from Watch Later`,
    UPDATE_ERROR: "Failed to update Watch Later",
    REMOVE_ERROR: "Failed to remove from Watch Later",
    CLEAR_SUCCESS: "Watch Later list cleared",
    CLEAR_ERROR: "Failed to clear Watch Later",
  },
  WISHLIST: {
    ADD_SUCCESS: (title) => `${title} added to wishlist`,
    REMOVE_SUCCESS: (title) => `${title} removed from wishlist`,
    UPDATE_ERROR: "Failed to update wishlist",
    REMOVE_ERROR: "Failed to remove from wishlist",
    CLEAR_SUCCESS: "Wishlist cleared",
    CLEAR_ERROR: "Failed to clear wishlist",
  },
  HISTORY: {
    REMOVE_SUCCESS: (title) => `${title} removed from history`,
    REMOVE_ERROR: "Failed to remove from history",
    CLEAR_SUCCESS: "Watch history cleared",
    CLEAR_ERROR: "Failed to clear history",
  },
  REVIEWS: {
    POST_SUCCESS: "Review posted successfully!",
    POST_ERROR: "Failed to post review",
    DELETE_SUCCESS: "Review deleted successfully!",
    DELETE_ERROR: "Could not delete review",
    UPDATE_SUCCESS: "Review updated successfully!",
    UPDATE_ERROR: "Failed to update review",
    REACTION_SUCCESS: "Reaction updated!",
    REACTION_ERROR: "Failed to update reaction",
    SPOILER_MARKED: "Marked as spoiler",
    SPOILER_UNMARKED: "Unmarked as spoiler",
    SPOILER_ERROR: "Failed to toggle spoiler",
  },
  USER_ACTIONS: {
    LIKE_ERROR: "Please log in to like reviews",
    DISLIKE_ERROR: "Please log in to dislike reviews",
  },
  ADMIN: {
    USER_DELETE_SUCCESS: "User deleted successfully",
    USER_DELETE_ERROR: "Failed to delete user",
    USER_ACTION_SUCCESS: (action) => `User ${action} successful`,
    USER_ACTION_ERROR: (action) => `Failed to ${action} user`,
    ROLE_UPDATE_SUCCESS: "User role updated successfully",
    ROLE_UPDATE_ERROR: "Failed to update role",
  },
  MEDIA: {
    REMOVE_SUCCESS: (title) => `${title} removed`,
  },
  VALIDATION: {
    USERNAME_EMPTY: "Username cannot be empty.",
    USERNAME_TOO_SHORT: "Username must be at least 3 characters.",
    PASSWORD_EMPTY: "Password cannot be empty.",
    PASSWORD_TOO_SHORT: "Password must be at least 6 characters.",
  },
  SUPPORT: {
    CREATE_SUCCESS: "Ticket created successfully!",
    CREATE_ERROR: "Failed to create ticket",
    FETCH_ERROR: "Failed to load tickets",
  },
};

export const showLoadingToast = (message) => {
  return toast.loading(message, {
    duration: Infinity,
  });
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const toastPromise = async (promise, messages) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
};

export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
  });
};

export const showError = (message) => {
  toast.error(message, {
    duration: 4000,
  });
};

export const showWarning = (message) => {
  toast.warning(message, {
    duration: 4000,
  });
};

export const showInfo = (message) => {
  toast.info(message, {
    duration: 3000,
  });
};
