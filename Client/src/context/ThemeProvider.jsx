import { createContext, useEffect, useState } from "react";

/**
 * ThemeContext
 * --------------------------------------------------
 * Provides theme state and toggle functionality
 * (light / dark mode).
 */
export const ThemeContext = createContext(null);

/**
 * Detect system preferred color scheme
 */
const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

/**
 * ThemeProvider
 * --------------------------------------------------
 * Handles theme persistence, system theme sync,
 * and manual theme toggling.
 */
const ThemeProvider = ({ children }) => {
  /**
   * Initialize theme from localStorage or system preference
   */
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || getSystemTheme();
  });

  /**
   * Listen for system theme changes
   * (only applies when user has not manually overridden)
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      setTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

   /**
    * Apply theme to HTML root and persist it
    */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  /**
   * Toggle between light and dark themes
   */
  const themeToggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  /**
   * Provide theme state and actions to consumers
   */
  return (
    <ThemeContext.Provider value={{ theme, themeToggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
