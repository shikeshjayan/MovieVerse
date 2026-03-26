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
import { UserPreferencesProvider } from "./context/UserPreferencesContext.jsx";
import ToastProvider from "./context/ToastProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <WatchHistoryProvider>
          <WatchLaterProvider>
            <WishlistProvider>
              <UserPreferencesProvider>
                <ReviewProvider>
                  <ToastProvider>
                    <App />
                  </ToastProvider>
                </ReviewProvider>
              </UserPreferencesProvider>
            </WishlistProvider>
          </WatchLaterProvider>
        </WatchHistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
