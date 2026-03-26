import { faAlarmClock,
  faHeart,
  faHouse,
  faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
  faArrowUp,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
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
const Topbar = () => {
  const navigate = useNavigate();

  // Controls visibility of sign-out confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);

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
      p-2 rounded-lg transition-colors duration-200
      ${
        isActive
          ? "bg-blue-300 text-blue-950 dark:bg-blue-800 dark:text-white"
          : "opacity-80 hover:opacity-100"
      }
      flex-shrink-0
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
        className="flex md:hidden p-4 gap-2 justify-start overflow-x-auto no-scrollbar bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-100">
        <NavLink to="/dashboard/home" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faHouse} />
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

        <NavLink to="/dashboard/wishlist" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faHeart} />
            <span
              className="
    absolute top-full mt-2 left-1/2 -translate-x-1/2
    bg-black text-white text-xs px-2 py-1 rounded
    whitespace-nowrap opacity-0 pointer-events-none
    group-hover:opacity-100 transition-opacity duration-200
  ">
              Wishlist
            </span>
          </motion.div>
        </NavLink>

        <NavLink to="/dashboard/history" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faClockRotateLeft} />
            <span
              className="
    absolute top-full mt-2 left-1/2 -translate-x-1/2
    bg-black text-white text-xs px-2 py-1 rounded
    whitespace-nowrap opacity-0 pointer-events-none
    group-hover:opacity-100 transition-opacity duration-200
  ">
              History
            </span>
          </motion.div>
        </NavLink>

        <NavLink to="/dashboard/myreviews" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faStar} />
            <span
              className="
    absolute top-full mt-2 left-1/2 -translate-x-1/2
    bg-black text-white text-xs px-2 py-1 rounded
    whitespace-nowrap opacity-0 pointer-events-none
    group-hover:opacity-100 transition-opacity duration-200
  ">
              Reviews
            </span>
          </motion.div>
        </NavLink>

        <NavLink to="/dashboard/watchlater" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group">
            <FontAwesomeIcon icon={faAlarmClock} />
            <span
              className="
    absolute top-full mt-2 left-1/2 -translate-x-1/2
    bg-black text-white text-xs px-2 py-1 rounded
    whitespace-nowrap opacity-0 pointer-events-none
    group-hover:opacity-100 transition-opacity duration-200
  ">
              Watch Later
            </span>
          </motion.div>
        </NavLink>

        {/* Exit Dashboard (Navigate to Home) */}
        <motion.button
          {...iconMotion}
          aria-label="Exit Dashboard"
          onClick={() => navigate("/home")}
          className="relative group p-2 rounded-lg">
          <img
            src="/exit_to_app_black.svg"
            alt="Exit"
            className="dark:hidden"
          />
          <img
            src="/exit_to_app_white.svg"
            alt="Exit"
            className="hidden dark:block"
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
          className="relative group p-2 rounded-lg">
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
