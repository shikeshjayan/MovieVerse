/**
 * NotificationModal Component
 * 
 * Modal popup for displaying system notifications and alerts.
 */
import { motion } from "framer-motion";

/**
 * @param {object} notification - Notification object with message and type
 * @param {function} onClose - Close handler
 */
const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-notification-modal
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {notification.mediaPoster && (
          <div className="relative h-72 shrink-0">
            {notification.mediaPoster ? (
              <img
                src={`https://image.tmdb.org/t/p/w780${notification.mediaPoster}`}
                alt={notification.mediaTitle}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "/placeholder.svg"; }}
              />
            ) : (
              <img
                src="/placeholder.svg"
                alt={notification.mediaTitle}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-[#0064E0] text-white rounded">
                {notification.mediaType === 'movie' ? 'Movie' : 'TV Show'}
              </span>
              {notification.mediaTitle && (
                <span className="text-white font-medium text-sm truncate">
                  {notification.mediaTitle}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              notification.type === "login" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
              notification.type === "register" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              notification.type === "wishlist_update" ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" :
              notification.type === "watchlater_update" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
              notification.type === "suspicious" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
              "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
            }`}>
              {notification.type === "wishlist_update" ? "Wishlist" :
               notification.type === "watchlater_update" ? "Watch Later" :
               notification.type}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {notification.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            {notification.message}
          </p>
          {(notification.type === "login" || notification.type === "register") && (
            <div className="space-y-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {notification.username && (
                <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Username:</span> <span className="font-medium text-gray-900 dark:text-white">{notification.username}</span></p>
              )}
              {notification.userEmail && (
                <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className="font-medium text-gray-900 dark:text-white">{notification.userEmail}</span></p>
              )}
              {notification.role && (
                <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Role:</span> <span className={`font-medium ${notification.role === "admin" ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"}`}>{notification.role}</span></p>
              )}
            </div>
          )}
          {notification.mediaTitle && (
            <p className="text-sm font-medium text-[#0064E0] dark:text-blue-400 mb-4">
              {notification.mediaTitle}
            </p>
          )}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(notification.createdAt).toLocaleString()}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0064E0] rounded-lg hover:bg-[#0052CC] transition">
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NotificationModal;
