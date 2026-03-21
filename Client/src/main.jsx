import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style/global_style.css";
import App from "./App.jsx";
import ThemeProvider from "./context/ThemeProvider.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WatchHistoryProvider } from "./context/WatchHistoryContext.jsx";
import { WatchLaterProvider } from "./context/WatchLaterContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { ReviewProvider } from "./context/ReviewContext.jsx";

/**
 * React 18 Root Entry Point - Movie Database App
 * ================================================
 * Production-ready context provider hierarchy with StrictMode
 *
 * Provider Stack (Innermost → Outermost):
 * App ← WatchLaterProvider ← WishlistProvider ← HistoryProvider
 *     ← AuthProvider ← ThemeProvider ← StrictMode
 *
 * Context Responsibilities:
 * ├── ThemeProvider     → Dark/Light mode toggle + CSS variables
 * ├── AuthProvider      → Firebase authentication state
 * ├── HistoryProvider   → User watch history tracking
 * ├── WishlistProvider  → User saved movies/TV wishlist
 * └── WatchLaterProvider→ User "watch later" queue
 */

/**
 * Initialize React Application
 * - Mounts to #root DOM element
 * - Applies StrictMode for development warnings
 * - Sequential context provider wrapping
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/*
     * THEME PROVIDER (Outermost)
     * Controls global dark/light theme switching
     * Applies CSS custom properties to :root
     */}
    <ThemeProvider>
      <AuthProvider>
        <WatchHistoryProvider>
          <WatchLaterProvider>
            <WishlistProvider>
              <ReviewProvider>
                <App />
              </ReviewProvider>
            </WishlistProvider>
          </WatchLaterProvider>
        </WatchHistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
