/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars */
/**
 * Header Navigation Component
 * 
 * Main application header with navigation, search, user menu, and notifications.
 * Features responsive design with mobile hamburger menu and real-time notification updates via Socket.IO.
 */
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../context/ThemeProvider";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { faMoon, faSun, faUser, faBell } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark, faSearch, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { useWishlist } from "../context/WishlistContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SignOutModal from "../ui/SignOutModal";
import NotificationModal from "./NotificationModal";
import ProfileDropdown from "./ProfileDropdown";

/**
 * Helper to conditionally join class names.
 * Avoids repetitive ternary chains for theme-based classes.
 */
const cn = (...classes) => classes.filter(Boolean).join(" ");

const NAV_LINKS = [
  { to: "/home", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/tvshows", label: "TV Shows" },
  { to: "/explore", label: "Explore" },
  { to: "/recommendations", label: "For You" },
];

// Framer Motion variants
const navVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } },
};

const logoVariants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut", delay: 0.2 },
  },
};

const navListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const navItemVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

const rightSideVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1, ease: "easeIn", delay: 0.6 },
  },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

const mobileItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

/**
 * Header Component
 * Renders the main navigation bar with:
 * - Logo (MovieVerse)
 * - Desktop navigation links (Home, Movies, TV Shows, For You)
 * - SearchBox, theme toggle, and profile/login button
 * - Mobile menu (hamburger menu + overlay)
 */
const Header = () => {
  const { user } = useAuth();
  const { triggerOnboarding } = useUserPreferences();
  const { watchLaterCount } = useWatchLater();
  const { wishlistCount } = useWishlist();
  const { historyCount } = useWatchHistory();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, themeToggle, userOverride, resetToSystem } = useContext(ThemeContext);

  const totalUserData = watchLaterCount + wishlistCount + historyCount;
  const hasEnoughData = totalUserData >= 5;

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const notificationRef = useRef(null);

  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      const modalElement = document.querySelector('[data-notification-modal]');
      const isClickOnModal = modalElement && modalElement.contains(event.target);
      if (notificationRef.current && !notificationRef.current.contains(event.target) && !isClickOnModal) {
        setIsNotificationsOpen(false);
      }
      if (!event.target.closest('[aria-label="Toggle theme"]') && !event.target.closest('.theme-dropdown')) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const isAdmin = user.role === "admin";
      const baseUrl = isAdmin ? "/admin/notifications" : "/users/notifications";
      const [notifsRes, countRes] = await Promise.all([
        apiClient.get(`${baseUrl}?limit=10`),
        apiClient.get(`${baseUrl}/unread-count`),
      ]);
      setNotifications(notifsRes.data.data || []);
      setUnreadCount(countRes.data.unreadCount || 0);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const baseUrl = user?.role === "admin" ? "/admin/notifications" : "/users/notifications";
      await apiClient.patch(`${baseUrl}/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const baseUrl = user?.role === "admin" ? "/admin/notifications" : "/users/notifications";
      console.log("API call to:", `${baseUrl}/read-all`, "unreadCount:", unreadCount);
      await apiClient.patch(`${baseUrl}/read-all`);
      console.log("Mark all successful");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      if (import.meta.env.DEV) console.error("Error:", err);
      toast.error("Failed to mark notifications as read");
    }
  };

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
  }, [isMobileMenuOpen]);

  const handleRouteChange = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    handleRouteChange();
  }, [location.pathname, handleRouteChange]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const handleThemeButtonClick = () => {
    setIsThemeMenuOpen(!isThemeMenuOpen);
  };

  const handleThemeOptionClick = (action) => {
    action();
    setIsThemeMenuOpen(false);
  };

  return (
    <header>
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
      />
      <motion.nav
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="fixed top-0 w-full flex justify-between items-center z-20 px-4 sm:px-6 lg:px-10 transition-all duration-300 h-14 sm:h-16 py-2 bg-[#FFFFFF]/95 text-[#1E293B] dark:bg-[#0F172A]/95 dark:text-[#F1F5F9] backdrop-blur-md shadow-md">
        <motion.div
          variants={logoVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={() => navigate("/home")}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0064E0] flex items-center justify-center">
            <FontAwesomeIcon icon={faPlay} className="text-white text-xs sm:text-sm ml-0.5" />
          </div>
          <span className="hidden sm:block text-lg sm:text-xl font-bold text-[#0064E0]">
            MovieVerse
          </span>
        </motion.div>

        <motion.ul
          variants={navListVariants}
          initial="hidden"
          animate="visible"
          className="hidden lg:flex gap-6 font-medium text-sm tracking-wide relative">
          {NAV_LINKS.map(({ to, label }) => (
            <motion.li
              key={to}
              variants={navItemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "relative py-2 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 focus-visible:rounded",
                    isActive ? "text-[#0064E0]" : "hover:text-[#0073ff]"
                  )
                }>
                {({ isActive }) => (
                  <>
                    {label}
                    <motion.span
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#0064E0] rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isActive ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  </>
                )}
              </NavLink>
            </motion.li>
          ))}
          
          {user && !hasEnoughData && user?.role !== "admin" && (
            <motion.button
              variants={navItemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerOnboarding}
              className="text-xs px-3 py-1.5 rounded-full border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors"
              title="Update your genre preferences"
              aria-label="Update genre preferences"
            >
              Preferences
            </motion.button>
          )}
        </motion.ul>

        <motion.div
          variants={rightSideVariants}
          initial="hidden"
          animate="visible"
          className="hidden lg:flex items-center gap-3 xl:gap-5">
          {user && (
            <NavLink
              to="/search"
              className="text-lg p-2 rounded-full transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 hover:scale-105"
              onClick={(e) => {
                if (location.pathname === "/search") {
                  e.preventDefault();
                  navigate(-1);
                }
              }}
            >
              <FontAwesomeIcon icon={faSearch} className="text-[#312F2C] dark:text-[#FAFAFA]" />
            </NavLink>
          )}

          <button
            onClick={handleThemeButtonClick}
            className="text-lg p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 relative"
            aria-label="Toggle theme">
            <FontAwesomeIcon
              icon={theme === "dark" ? faSun : faMoon}
              className="text-[#312F2C] dark:text-[#FAFAFA]"
            />
          </button>
          {isThemeMenuOpen && (
            <div className="theme-dropdown absolute right-2 top-full mt-2 w-44 bg-white dark:bg-[#1E1E2E] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700/50 z-50 overflow-hidden">
              <div className="py-1">
                <button
                  onClick={() => handleThemeOptionClick(themeToggle)}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#312F2C] dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#2D2D3D] flex items-center justify-between transition-colors">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} className="text-sm" />
                </button>
                <button
                  onClick={() => handleThemeOptionClick(resetToSystem)}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#312F2C] dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#2D2D3D] flex items-center justify-between transition-colors border-t border-gray-100 dark:border-gray-700/50">
                  Follow System
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">Auto</span>
                </button>
              </div>
            </div>
          )}

          {user && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="text-lg p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 relative hover:scale-105 transition-transform">
                <FontAwesomeIcon icon={faBell} className="text-[#312F2C] dark:text-[#FAFAFA]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {user ? (
            <div className="relative" ref={profileRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 font-medium rounded-lg px-4 xl:px-5 py-2 text-sm bg-[#0064E0] text-[#FAFAFA] hover:bg-[#0073ff] transition">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="text-sm" />
                )}
                <span>{user.username}</span>
              </motion.button>

              <ProfileDropdown
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                onSignOut={() => {
                  setIsSignOutModalOpen(true);
                  setIsProfileOpen(false);
                }}
              />
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 font-medium rounded-lg px-4 xl:px-5 py-2 text-sm bg-[#0064E0] text-[#FAFAFA] hover:bg-[#0073ff] transition">
              <FontAwesomeIcon icon={faUser} className="text-sm" />
              <span>Login</span>
            </motion.button>
          )}
        </motion.div>

        <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
          {user && (
            <NavLink
              to="/search"
              className="p-2 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 hover:scale-110 active:scale-95"
              aria-label="Search"
              onClick={(e) => {
                if (location.pathname === "/search") {
                  e.preventDefault();
                  navigate(-1);
                }
              }}
            >
              <FontAwesomeIcon icon={faSearch} size="lg" />
            </NavLink>
          )}
          <button
            onClick={handleThemeButtonClick}
            className="p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 hover:scale-110 active:scale-95 relative"
            aria-label="Toggle theme">
            <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} size="lg" className="text-[#312F2C] dark:text-[#FAFAFA]" />
          </button>
          {isThemeMenuOpen && (
            <div className="theme-dropdown absolute right-2 top-full mt-2 w-44 bg-white dark:bg-[#1E1E2E] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700/50 z-50 overflow-hidden">
              <div className="py-1">
                <button
                  onClick={() => handleThemeOptionClick(themeToggle)}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#312F2C] dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#2D2D3D] flex items-center justify-between transition-colors">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} className="text-sm" />
                </button>
                <button
                  onClick={() => handleThemeOptionClick(resetToSystem)}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#312F2C] dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#2D2D3D] flex items-center justify-between transition-colors border-t border-gray-100 dark:border-gray-700/50">
                  Follow System
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">Auto</span>
                </button>
              </div>
            </div>
          )}

          {user && (
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 hover:scale-110 active:scale-95 relative"
              aria-label="Notifications">
              <FontAwesomeIcon icon={faBell} size="lg" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}

          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#0064E0] hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2"
              aria-label="Go to dashboard">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#0064E0] flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-3 py-2 rounded-lg bg-[#0064E0] text-white text-sm font-medium hover:bg-[#0073ff] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2">
              Login
            </button>
          )}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 hover:scale-110 active:scale-95"
            aria-label="Toggle menu">
            <FontAwesomeIcon
              icon={isMobileMenuOpen ? faXmark : faBars}
              size="lg"
            />
          </button>
        </div>
      </motion.nav>

      {/* Notification Dropdown - visible on all screens */}
      {user && (
        <AnimatePresence>
          {isNotificationsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-14 sm:top-16 right-4 sm:right-6 w-80 max-h-96 overflow-y-auto bg-white dark:bg-[#1E293B] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Notifications</h3>
                <button
                onClick={() => {
                  console.log("Mark all clicked, unreadCount:", unreadCount);
                  markAllAsRead();
                }}
                className="text-xs text-[#0064E0] hover:underline cursor-pointer"
                aria-label="Mark all notifications as read"
              >
                Mark all read
              </button>
              </div>
              <div className="max-h-72 overflow-y-auto notifications-list">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No notifications yet
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => {
                        if (!notif.read) markAsRead(notif._id);
                        if (notif.mediaTitle || notif.mediaPoster || notif.tmdbId || notif.type === "login" || notif.type === "register" || notif.type === "suspicious" || notif.type === "admin_action") {
                          setSelectedNotification(notif);
                        }
                      }}
                      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition ${
                        !notif.read ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                      }`}>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {notif.userEmail && `User: ${notif.userEmail}`}
                        {notif.createdAt && ` • ${new Date(notif.createdAt).toLocaleString()}`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <NotificationModal
            notification={selectedNotification}
            onClose={() => setSelectedNotification(null)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-14 sm:top-16 left-0 w-full max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col p-4 sm:p-6 gap-1 z-50 shadow-xl overflow-y-auto rounded-b-2xl bg-[#FFFFFF]/98 text-[#1E293B] dark:bg-[#0F172A]/98 dark:text-[#F1F5F9] backdrop-blur-lg">
            {user && (
              <motion.div
                variants={mobileItemVariants}
                className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-[#0064E0]/10">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#0064E0]">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#0064E0] flex items-center justify-center">
                      <FontAwesomeIcon icon={faUser} className="text-white text-xl" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </motion.div>
            )}

            <nav className="flex flex-col gap-1 mb-3">
              {NAV_LINKS.map(({ to, label }) => (
                <motion.div key={to} variants={mobileItemVariants}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium transition-all",
                        isActive
                          ? "text-[#0064E0] bg-[#0064E0]/10"
                          : "hover:bg-gray-100 dark:hover:bg-white/5"
                      )
                    }>
                    {label}
                  </NavLink>
                </motion.div>
              ))}
              
          {user && !hasEnoughData && user?.role !== "admin" && (
                <motion.div variants={mobileItemVariants}>
                  <button
                    onClick={() => {
                      triggerOnboarding();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium transition-all text-cyan-500 hover:bg-cyan-500/10"
                  >
                    Preferences
                  </button>
                </motion.div>
              )}
            </nav>

            {user ? (
              <motion.div variants={mobileItemVariants} className="flex flex-col gap-2 mt-auto">
                {user?.role === "admin" && (
                  <button
                    onClick={() => {
                      navigate("/admin");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full font-medium rounded-xl px-6 py-3 bg-[#0064E0] text-[#FAFAFA] hover:bg-[#0073ff] transition text-base"
                    aria-label="Go to admin dashboard"
                  >
                    Admin Dashboard
                  </button>
                )}
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full font-medium rounded-xl px-6 py-3 bg-[#0064E0] text-[#FAFAFA] hover:bg-[#0073ff] transition text-base"
                  aria-label="Go to my dashboard"
                >
                  My Dashboard
                </button>
                <button
                  onClick={() => {
                    setIsSignOutModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                  aria-label="Sign out from account"
                >
                  Sign Out
                </button>
              </motion.div>
            ) : (
              <motion.button
                variants={mobileItemVariants}
                onClick={() => {
                  navigate("/login");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full font-medium rounded-xl px-6 py-3 bg-[#0064E0] text-[#FAFAFA] hover:bg-[#0073ff] transition text-base">
                Sign In
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
