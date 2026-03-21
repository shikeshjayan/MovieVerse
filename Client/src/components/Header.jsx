/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars */
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import SearchBox from "../features/search/SearchBox";
import { ThemeContext } from "../context/ThemeProvider";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { faMoon, faSun, faUser } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ProfileDropdown from "./ProfileDropdown";
import { faBars, faXmark, faSearch, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
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
  { to: "/Recommendations", label: "For You" },
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
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, themeToggle } = useContext(ThemeContext);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const isDark = theme === "dark";
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
        className={cn(
          "fixed top-0 w-full flex justify-between items-center z-20 px-4 sm:px-6 lg:px-10 transition-all duration-300",
          isScrolled ? "h-14 sm:h-16 py-2" : "h-16 sm:h-20 py-3",
          isDark
            ? "bg-[#0F172A]/95 text-[#F1F5F9]"
            : "bg-[#FFFFFF]/95 text-[#1E293B]",
          "backdrop-blur-md shadow-md"
        )}>
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
          <span className="text-lg sm:text-xl font-bold text-[#0064E0]">
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
        </motion.ul>

        <motion.div
          variants={rightSideVariants}
          initial="hidden"
          animate="visible"
          className="hidden lg:flex items-center gap-3 xl:gap-5">
          <div className="relative group">
            <SearchBox />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[9px] font-mono">
                {isMac ? "⌘" : "Ctrl"}K
              </kbd>
            </span>
          </div>

          <button
            onClick={themeToggle}
            className="text-lg p-2 rounded-full">
            <FontAwesomeIcon
              icon={isDark ? faSun : faMoon}
              className={isDark ? "text-[#FAFAFA]" : "text-[#312F2C]"}
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
            />
          </div>
        </motion.div>

        <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Toggle search">
            <FontAwesomeIcon icon={faSearch} size="lg" />
          </button>
          <button
            onClick={themeToggle}
            className="p-2 rounded-full"
            aria-label="Toggle theme">
            <FontAwesomeIcon icon={isDark ? faSun : faMoon} size="lg" />
          </button>
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#0064E0] hover:scale-105 transition-transform">
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
              className="px-3 py-2 rounded-lg bg-[#0064E0] text-white text-sm font-medium hover:bg-[#0073ff] transition">
              Login
            </button>
          )}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
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
        {isMobileSearchOpen && (
          <motion.div
            key="mobile-search"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed top-14 sm:top-16 left-0 w-full z-30 p-4 shadow-md",
              isDark ? "bg-[#0F172A]/98" : "bg-[#FFFFFF]/98",
              "backdrop-blur-lg"
            )}>
            <SearchBox />
          </motion.div>
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
            className={cn(
              "fixed top-14 sm:top-16 left-0 w-full max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-4rem)]",
              "flex flex-col p-4 sm:p-6 gap-1 z-50 shadow-xl overflow-y-auto rounded-b-2xl",
              isDark
                ? "bg-[#0F172A]/98 text-[#F1F5F9]"
                : "bg-[#FFFFFF]/98 text-[#1E293B]",
              "backdrop-blur-lg"
            )}>
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
                          : isDark
                            ? "hover:bg-white/5"
                            : "hover:bg-gray-100",
                      )
                    }>
                    {label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            {user ? (
              <motion.div variants={mobileItemVariants} className="flex flex-col gap-2 mt-auto">
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
