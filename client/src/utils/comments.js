/**
 * Comments Storage Utility
 * -----------------------
 * Simple localStorage-based comment system for movie/TV show pages
 * Key-based storage: comments[movieId] = [{user, text, timestamp}]
 */

/**
 * Retrieve comments for specific media item
 * @param {string|number} key - Movie/TV show ID
 * @returns {Array} Array of comment objects or empty array
 * @example getComments(123) → [{user: "John", text: "Great movie!", timestamp: 1640995200}]
 */
export const getComments = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem("comments")) || {};
    return data[key] || [];
  } catch (error) {
    console.error("Error reading comments from localStorage:", error);
    return [];
  }
};

/**
 * Add new comment to specific media item
 * @param {string|number} key - Movie/TV show ID  
 * @param {Object} comment - Comment object {user, text, timestamp, id?}
 * @example addComment(123, {user: "Jane", text: "Loved it!", timestamp: Date.now()})
 */
export const addComment = (key, comment) => {
  try {
    const data = JSON.parse(localStorage.getItem("comments")) || {};
    
    // Initialize array if doesn't exist
    data[key] = [...(data[key] || []), { ...comment, id: Date.now() }];
    
    // Persist to localStorage
    localStorage.setItem("comments", JSON.stringify(data));
  } catch (error) {
    console.error("Error saving comment to localStorage:", error);
    throw error; // Re-throw for UI error handling
  }
};

/**
 * Delete comment by ID for specific media item
 * @param {string|number} key - Movie/TV show ID
 * @param {string|number} commentId - Unique comment ID
 */
export const deleteComment = (key, commentId) => {
  try {
    const data = JSON.parse(localStorage.getItem("comments")) || {};
    if (data[key]) {
      data[key] = data[key].filter(comment => comment.id !== commentId);
      localStorage.setItem("comments", JSON.stringify(data));
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
  }
};

/**
 * Update existing comment
 * @param {string|number} key - Movie/TV show ID
 * @param {string|number} commentId - Unique comment ID  
 * @param {Object} updatedComment - Updated comment data
 */
export const updateComment = (key, commentId, updatedComment) => {
  try {
    const data = JSON.parse(localStorage.getItem("comments")) || {};
    if (data[key]) {
      data[key] = data[key].map(comment => 
        comment.id === commentId ? { ...comment, ...updatedComment } : comment
      );
      localStorage.setItem("comments", JSON.stringify(data));
    }
  } catch (error) {
    console.error("Error updating comment:", error);
  }
};

/**
 * Clear all comments for specific media item
 * @param {string|number} key - Movie/TV show ID
 */
export const clearComments = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem("comments")) || {};
    delete data[key];
    localStorage.setItem("comments", JSON.stringify(data));
  } catch (error) {
    console.error("Error clearing comments:", error);
  }
};

/**
 * Usage Example:
 * 
 * // Add comment to movie 123
 * addComment(123, {
 *   user: "john_doe",
 *   text: "Amazing movie! 10/10",
 *   timestamp: Date.now(),
 *   rating: 5
 * });
 * 
 * // Get comments
 * const comments = getComments(123);
 */
