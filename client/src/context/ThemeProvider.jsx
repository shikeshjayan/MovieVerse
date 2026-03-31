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
const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

/**
 * ThemeProvider
 * --------------------------------------------------
 * Handles theme persistence, system theme sync,
 * and manual theme toggling.
 */
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("theme") || getSystemTheme();
  });

  const [userOverride, setUserOverride] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("theme");
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    
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
    if (typeof window === "undefined") return;
    
    document.documentElement.setAttribute("data-theme", theme);
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    if (userOverride) {
      localStorage.setItem("theme", theme);
    } else {
      localStorage.removeItem("theme");
    }
  }, [theme, userOverride]);

  const themeToggle = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      setUserOverride(true);
      return newTheme;
    });
  };

  const resetToSystem = () => {
    setUserOverride(false);
    setTheme(getSystemTheme());
  };

  /**
   * Provide theme state and actions to consumers
   */
  return (
    <ThemeContext.Provider value={{ theme, themeToggle, userOverride, resetToSystem }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
