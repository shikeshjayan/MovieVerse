/**
 * Dashboard Topbar Component
 * 
 * Mobile-friendly top navigation bar with menu toggle and user actions.
 */
import { faAlarmClock,
  faHeart,
  faHouse,
  faStar,
  faUser,
} from "@fortawesome/free-regular-svg-icons";
import {
  faArrowLeft,
  faClockRotateLeft,
  faHeadset,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import SignOutModal from "../../ui/SignOutModal";
import { motion } from "framer-motion";

const Topbar = () => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const iconMotion = {
    whileHover: { scale: 1.15 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 300 },
  };

  const navLinkClass = ({ isActive }) =>
    `
      p-1 sm:p-2 rounded-lg transition-colors duration-200
      ${
        isActive
          ? "bg-blue-300 text-blue-950 dark:bg-blue-800 dark:text-white"
          : "opacity-80 hover:opacity-100"
      }
      flex-shrink-0 flex items-center justify-center
    `;

  const tooltipClass = `
    absolute top-full mt-1 sm:mt-2 left-1/2 -translate-x-1/2
    bg-black text-white text-[8px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded
    whitespace-nowrap opacity-0 pointer-events-none
    group-hover:opacity-100 transition-opacity duration-200
  `;

  const redTooltipClass = `
    absolute top-full mt-1 sm:mt-2 left-1/2 -translate-x-1/2
    bg-red-600 text-white text-[8px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded
    whitespace-nowrap opacity-0 pointer-events-none
    group-hover:opacity-100 transition-opacity duration-200
  `;

  return (
    <>
      <SignOutModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
      />

      <nav
        className="flex md:hidden p-1 sm:p-4 gap-1 sm:gap-2 items-center justify-center overflow-x-auto no-scrollbar bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-100 min-h-[44px] sm:min-h-[60px] w-full">
        <NavLink to="/dashboard/home" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group flex items-center justify-center">
            <FontAwesomeIcon icon={faHouse} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className={tooltipClass}>Home</span>
          </motion.div>
        </NavLink>

        <NavLink to="/dashboard" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group flex items-center justify-center">
            <FontAwesomeIcon icon={faUser} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className={tooltipClass}>User</span>
          </motion.div>
        </NavLink>

        <NavLink to="/dashboard/wishlist" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group flex items-center justify-center">
            <FontAwesomeIcon icon={faHeart} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className={tooltipClass}>Wishlist</span>
          </motion.div>
        </NavLink>

        <NavLink to="/dashboard/history" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group flex items-center justify-center">
            <FontAwesomeIcon icon={faClockRotateLeft} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className={tooltipClass}>History</span>
          </motion.div>
        </NavLink>

        <NavLink to="/dashboard/myreviews" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group flex items-center justify-center">
            <FontAwesomeIcon icon={faStar} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className={tooltipClass}>Reviews</span>
          </motion.div>
        </NavLink>

        <NavLink to="/dashboard/watchlater" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group flex items-center justify-center">
            <FontAwesomeIcon icon={faAlarmClock} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className={tooltipClass}>Watch Later</span>
          </motion.div>
        </NavLink>

        <NavLink to="/dashboard/support" className={navLinkClass}>
          <motion.div {...iconMotion} className="relative group flex items-center justify-center">
            <FontAwesomeIcon icon={faHeadset} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className={tooltipClass}>Support</span>
          </motion.div>
        </NavLink>

        <motion.button
          {...iconMotion}
          aria-label="Exit Dashboard"
          onClick={() => navigate("/home")}
          className="relative group flex items-center justify-center p-1 sm:p-2 rounded-lg flex-shrink-0">
          <img src="/exit_to_app_black.svg" alt="Exit" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 dark:hidden" />
          <img src="/exit_to_app_white.svg" alt="Exit" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 hidden dark:block" />
          <span className={tooltipClass}>Exit</span>
        </motion.button>

        <motion.button
          {...iconMotion}
          aria-label="Sign Out"
          onClick={() => setShowConfirm(true)}
          className="relative group flex items-center justify-center p-1 sm:p-2 rounded-lg flex-shrink-0">
          <FontAwesomeIcon icon={faArrowLeft} className="text-red-500 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span className={redTooltipClass}>Log Out</span>
        </motion.button>
      </nav>
    </>
  );
};

export default Topbar;
