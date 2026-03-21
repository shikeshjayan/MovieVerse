import {
  faAlarmClock,
  faComment,
  faHeart,
  faHome,
  faHouse,
  faStar,
  faUser,
} from "@fortawesome/free-regular-svg-icons";
import {
  faArrowLeft,
  faArrowUp,
  faClockRotateLeft,
  faTv,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../../context/ThemeProvider";
import SignOutModal from "../../ui/SignOutModal";
import { motion } from "framer-motion";

/**
 * Topbar
 * --------------------------------------------------
 * Mobile-only dashboard navigation bar.
 * Includes:
 * - Active route styling
 * - Framer Motion icon animations
 * - Sign-out confirmation modal
 */
const Topbar = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  // Controls visibility of sign-out confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);

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
    whileHover: { scale: 1.15 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 300 },
  };

  /**
   * NavLink styling with active state support
   */
  const navLinkClass = ({ isActive }) =>
    `
      p-1.5 sm:p-2 rounded-lg transition-colors duration-200 touch-manipulation
      ${
        isActive
          ? theme === "dark"
            ? "bg-blue-800 text-white"
            : "bg-blue-300 text-blue-950"
          : "opacity-80 hover:opacity-100"
      }
    `;

  return (
    <>
      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
      />

      {/* Mobile Top Navigation */}
      <nav
        className={`flex md:hidden p-2 sm:p-3 md:p-4 justify-evenly ${
          theme === "dark"
            ? "bg-blue-950 text-blue-100"
            : "bg-blue-100 text-blue-950"
        }`}>
        <NavLink
          to="/admin"
          className={navLinkClass}
          onClick={() => setOpen(false)}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faHome} />
            <span
              className="
    absolute top-full mt-2 left-1/2 -translate-x-1/2
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
    absolute top-full mt-2 left-1/2 -translate-x-1/2
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
    absolute top-full mt-2 left-1/2 -translate-x-1/2
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
    absolute top-full mt-2 left-1/2 -translate-x-1/2
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
    absolute top-full mt-2 left-1/2 -translate-x-1/2
    bg-black text-white text-xs px-2 py-1 rounded
    whitespace-nowrap opacity-0 pointer-events-none
    group-hover:opacity-100 transition-opacity duration-200
  ">
              Comments
            </span>
          </motion.div>
        </NavLink>

        {/* Exit Dashboard (Navigate to Home) */}
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
    absolute top-full mt-2 left-1/2 -translate-x-1/2
    bg-black text-white text-xs px-2 py-1 rounded
    whitespace-nowrap opacity-0 pointer-events-none
    group-hover:opacity-100 transition-opacity duration-200
  ">
            Exit
          </span>
        </motion.button>

        {/* Sign Out Button */}
        <motion.button
          {...iconMotion}
          aria-label="Sign Out"
          onClick={() => setShowConfirm(true)}
          className="p-2 rounded-lg relative group">
          <FontAwesomeIcon icon={faArrowUp} className="text-red-500" />
          <span
            className="
    absolute top-full mt-2 left-1/2 -translate-x-1/2
    bg-red-600 text-white text-xs px-2 py-1 rounded
    whitespace-nowrap opacity-0 pointer-events-none
    group-hover:opacity-100 transition-opacity duration-200
  ">
            Log Out
          </span>
        </motion.button>
      </nav>
    </>
  );
};

export default Topbar;
