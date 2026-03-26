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
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || getSystemTheme();
  });

  const [userOverride, setUserOverride] = useState(() => {
    return !!localStorage.getItem("theme");
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      if (!userOverride) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [userOverride]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    localStorage.setItem("theme", theme);
  }, [theme]);

  const themeToggle = () => {
    setUserOverride(true);
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
