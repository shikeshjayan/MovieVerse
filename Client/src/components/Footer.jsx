import { NavLink } from "react-router-dom";

/**
 * Footer Component
 * Renders the site footer with:
 * - App name (Recommended Movie Database)
 * - Navigation links (Home, Movies, TV Shows, Dashboard)
 * - Copyright notice
 */
const Footer = () => {
  return (
    <footer>
      <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 shadow-lg border-t bg-white text-[#1E293B] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
        {/* Footer Navigation */}
        <ul className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `font-medium transition-colors ${
                isActive
                  ? "text-[#0064E0]"
                  : "text-gray-600 dark:text-gray-400 hover:text-[#0064E0]"
              }`
            }>
            Home
          </NavLink>
          <NavLink
            to="/movies"
            className={({ isActive }) =>
              `font-medium transition-colors ${
                isActive
                  ? "text-[#0064E0]"
                  : "text-gray-600 dark:text-gray-400 hover:text-[#0064E0]"
              }`
            }>
            Movies
          </NavLink>
          <NavLink
            to="/tvshows"
            className={({ isActive }) =>
              `font-medium transition-colors ${
                isActive
                  ? "text-[#0064E0]"
                  : "text-gray-600 dark:text-gray-400 hover:text-[#0064E0]"
              }`
            }>
            TV Shows
          </NavLink>
          <NavLink
            to="/Recommendations"
            className={({ isActive }) =>
              `font-medium transition-colors ${
                isActive
                  ? "text-[#0064E0]"
                  : "text-gray-600 dark:text-gray-400 hover:text-[#0064E0]"
              }`
            }>
            For You
          </NavLink>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `font-medium transition-colors ${
                isActive
                  ? "text-[#0064E0]"
                  : "text-gray-600 dark:text-gray-400 hover:text-[#0064E0]"
              }`
            }>
            Admin
          </NavLink>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <NavLink
            to="/dashboard/home"
            className={({ isActive }) =>
              `font-medium transition-colors ${
                isActive
                  ? "text-[#0064E0]"
                  : "text-gray-600 dark:text-gray-400 hover:text-[#0064E0]"
              }`
            }>
            Dashboard
          </NavLink>
        </ul>

        <hr className="w-full h-px border-gray-200 dark:border-gray-700" />

        {/* Copyright */}
        <div className="text-xs sm:text-sm text-gray-500">
          © 2026 MovieVerse. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
