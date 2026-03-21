import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { ThemeContext } from "../context/ThemeProvider";

/**
 * Footer Component
 * Renders the site footer with:
 * - App name (Recommended Movie Database)
 * - Navigation links (Home, Movies, TV Shows, Dashboard)
 * - Copyright notice
 */
const Footer = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <footer>
      <div
        className={`flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 shadow-lg border-t
          ${
            theme === "dark"
              ? "bg-[#0F172A] text-[#F1F5F9]"
              : "bg-[#FFFFFF] text-[#1E293B]"
          }
        `}>

        {/* Footer Navigation */}
        <ul className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `font-medium transition-colors ${
                isActive
                  ? "text-[#0064E0]"
                  : theme === "dark"
                    ? "text-gray-400 hover:text-[#0064E0]"
                    : "text-gray-600 hover:text-[#0064E0]"
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
                  : theme === "dark"
                    ? "text-gray-400 hover:text-[#0064E0]"
                    : "text-gray-600 hover:text-[#0064E0]"
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
                  : theme === "dark"
                    ? "text-gray-400 hover:text-[#0064E0]"
                    : "text-gray-600 hover:text-[#0064E0]"
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
                  : theme === "dark"
                    ? "text-gray-400 hover:text-[#0064E0]"
                    : "text-gray-600 hover:text-[#0064E0]"
              }`
            }>
            For You
          </NavLink>
          <span className={theme === "dark" ? "text-gray-600" : "text-gray-300"}>|</span>
          <NavLink
            to="/dashboard/home"
            className={({ isActive }) =>
              `font-medium transition-colors ${
                isActive
                  ? "text-[#0064E0]"
                  : theme === "dark"
                    ? "text-gray-400 hover:text-[#0064E0]"
                    : "text-gray-600 hover:text-[#0064E0]"
              }`
            }>
            Dashboard
          </NavLink>
        </ul>

        <hr className={`w-full h-px ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`} />

        {/* Copyright */}
        <div className="text-xs sm:text-sm text-gray-500">© 2026 MovieVerse. All Rights Reserved.</div>
      </div>
    </footer>
  );
};

export default Footer;
