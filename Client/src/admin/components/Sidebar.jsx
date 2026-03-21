import { useAuth } from "../../context/AuthContext";
import {
  faAlarmClock,
  faComment,
  faHome,
  faUser,
} from "@fortawesome/free-regular-svg-icons";
import {
  faArrowLeft,
  faTv,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../../context/ThemeProvider";
import { motion } from "framer-motion";
import SignOutModal from "../../ui/SignOutModal";

/**
 * Sidebar
 * --------------------------------------------------
 * Dashboard sidebar with:
 * - Active route styling
 * - Keyboard accessibility
 * - Theme-aware UI
 * - Icon hover animations
 */
const Sidebar = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  const { logout } = useAuth();

  const [showConfirm, setShowConfirm] = useState(false);

  // 3. Create a handler for the final logout action
  const handleLogoutAction = async () => {
    try {
      await logout(); // Clears context and server session
      setShowConfirm(false);
      navigate("/login"); // Send them back to login
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  /**
   * Close sidebar when ESC key is pressed
   * Improves keyboard accessibility
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  /**
   * Shared Framer Motion animation for icons
   */
  const iconMotion = {
    whileHover: { scale: 1.15, rotate: 5 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 300 },
  };

  /**
   * Dynamic NavLink styling with active state
   */
  const navLinkClass = ({ isActive }) =>
    `
      flex items-center justify-center p-2 rounded-lg
      transition-colors duration-200
      ${
        isActive
          ? theme === "dark"
            ? "bg-blue-800 text-white"
            : "bg-blue-300 text-blue-950"
          : "opacity-80 hover:opacity-100"
      }
    `;

  return (
    <aside
      tabIndex={0}
      aria-hidden={!open}
      className={`
        fixed md:static top-0 left-0 h-screen md:h-auto md:self-stretch
        p-4 sm:p-6 transform transition-transform duration-300
        focus:outline-none overflow-y-auto md:overflow-visible
        ${open ? "translate-x-0 z-40" : "-translate-x-full md:translate-x-0"}
        ${
          theme === "dark"
            ? "bg-blue-950 text-blue-100"
            : "bg-blue-100 text-blue-950"
        }
      `}>
      <SignOutModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLogoutAction}
      />
      {/* Navigation */}
      <nav className="flex flex-col space-y-4 sm:space-y-6 text-lg sm:text-xl">
        <NavLink
          to="/admin"
          className={navLinkClass}
          onClick={() => setOpen(false)}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faHome} />
            <span
              className="
      absolute left-full ml-3 top-1/2 -translate-y-1/2
      bg-black text-white text-xs px-2 py-1 rounded
      whitespace-nowrap opacity-0 pointer-events-none
      group-hover:opacity-100 transition-opacity duration-200
    ">
              Home
            </span>
          </motion.div>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={navLinkClass}
          onClick={() => setOpen(false)}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faUser} />
            <span
              className="
      absolute left-full ml-3 top-1/2 -translate-y-1/2
      bg-black text-white text-xs px-2 py-1 rounded
      whitespace-nowrap opacity-0 pointer-events-none
      group-hover:opacity-100 transition-opacity duration-200
    ">
              Users
            </span>
          </motion.div>
        </NavLink>

        <NavLink
          to="/admin/movies"
          className={navLinkClass}
          onClick={() => setOpen(false)}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faVideo} />
            <span
              className="
      absolute left-full ml-3 top-1/2 -translate-y-1/2
      bg-black text-white text-xs px-2 py-1 rounded
      whitespace-nowrap opacity-0 pointer-events-none
      group-hover:opacity-100 transition-opacity duration-200
    ">
              Movies
            </span>
          </motion.div>
        </NavLink>

        <NavLink
          to="/admin/shows"
          className={navLinkClass}
          onClick={() => setOpen(false)}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faTv} />
            <span
              className="
      absolute left-full ml-3 top-1/2 -translate-y-1/2
      bg-black text-white text-xs px-2 py-1 rounded
      whitespace-nowrap opacity-0 pointer-events-none
      group-hover:opacity-100 transition-opacity duration-200
    ">
              TV Shows
            </span>
          </motion.div>
        </NavLink>

        <NavLink
          to="/admin/reviews"
          className={navLinkClass}
          onClick={() => setOpen(false)}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faComment} />
            <span
              className="
      absolute left-full ml-3 top-1/2 -translate-y-1/2
      bg-black text-white text-xs px-2 py-1 rounded
      whitespace-nowrap opacity-0 pointer-events-none
      group-hover:opacity-100 transition-opacity duration-200
    ">
              Comments
            </span>
          </motion.div>
        </NavLink>

        <NavLink
          to="/dashboard/watchlater"
          className={navLinkClass}
          onClick={() => setOpen(false)}>
          <motion.div {...iconMotion}>
            <FontAwesomeIcon icon={faAlarmClock} />
          </motion.div>
        </NavLink>

        {/* Exit Dashboard */}
        <motion.button
          {...iconMotion}
          aria-label="Exit Dashboard"
          onClick={() => navigate("/home")}
          className="flex items-center justify-center p-2 rounded-lg relative group">
          <img
            src={
              theme === "dark"
                ? "/exit_to_app_white.svg"
                : "/exit_to_app_black.svg"
            }
            alt="Exit"
          />
          <span
            className="
      absolute left-full ml-3 top-1/2 -translate-y-1/2
      bg-black text-white text-xs px-2 py-1 rounded
      whitespace-nowrap opacity-0 pointer-events-none
      group-hover:opacity-100 transition-opacity duration-200
    ">
            Exit
          </span>
        </motion.button>

        <motion.button
          {...iconMotion}
          aria-label="Sign Out"
          onClick={() => setShowConfirm(true)}
          className="p-2 rounded-lg relative group">
          <FontAwesomeIcon icon={faArrowLeft} className="text-red-500" />
          <span
            className="
      absolute left-full ml-3 top-1/2 -translate-y-1/2
      bg-red-600 text-white text-xs px-2 py-1 rounded
      whitespace-nowrap opacity-0 pointer-events-none
      group-hover:opacity-100 transition-opacity duration-200
    ">
            Log Out
          </span>
        </motion.button>
      </nav>
    </aside>
  );
};

export default Sidebar;
