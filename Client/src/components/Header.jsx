/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars */
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../context/ThemeProvider";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { faMoon, faSun, faUser } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ProfileDropdown from "./ProfileDropdown";
import { faBars, faXmark, faSearch, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { useWishlist } from "../context/WishlistContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { motion, AnimatePresence } from "framer-motion";
import SignOutModal from "../ui/SignOutModal";

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
  const { theme, themeToggle } = useContext(ThemeContext);

  const totalUserData = watchLaterCount + wishlistCount + historyCount;
  const hasEnoughData = totalUserData >= 5;

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          
          {user && !hasEnoughData && (
            <motion.button
              variants={navItemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerOnboarding}
              className="text-xs px-3 py-1.5 rounded-full border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors"
              title="Update your genre preferences"
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
          <NavLink
            to="/search"
            className="text-lg p-2 rounded-full transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 hover:scale-105">
            <FontAwesomeIcon icon={faSearch} className="text-[#312F2C] dark:text-[#FAFAFA]" />
          </NavLink>

          <button
            onClick={themeToggle}
            className="text-lg p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2">
            <FontAwesomeIcon
              icon={theme === "dark" ? faSun : faMoon}
              className="text-[#312F2C] dark:text-[#FAFAFA]"
            />
          </button>

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
              <span>{user ? user.username : "Login"}</span>
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
        </motion.div>

        <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
          <NavLink
            to="/search"
            className="p-2 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 hover:scale-110 active:scale-95"
            aria-label="Search">
            <FontAwesomeIcon icon={faSearch} size="lg" />
          </NavLink>
          <button
            onClick={themeToggle}
            className="p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064E0] focus-visible:ring-offset-2 hover:scale-110 active:scale-95"
            aria-label="Toggle theme">
            <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} size="lg" className="text-[#312F2C] dark:text-[#FAFAFA]" />
          </button>
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
              
              {user && !hasEnoughData && (
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
                    className="w-full font-medium rounded-xl px-6 py-3 bg-[#0064E0] text-[#FAFAFA] hover:bg-[#0073ff] transition text-base">
                    Admin Dashboard
                  </button>
                )}
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full font-medium rounded-xl px-6 py-3 bg-[#0064E0] text-[#FAFAFA] hover:bg-[#0073ff] transition text-base">
                  My Dashboard
                </button>
                <button
                  onClick={() => {
                    setIsSignOutModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition">
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
