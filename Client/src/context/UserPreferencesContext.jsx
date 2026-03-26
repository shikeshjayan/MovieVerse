import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useWatchLater } from "./WatchLaterContext";
import { useWishlist } from "./WishlistContext";
import { useWatchHistory } from "./WatchHistoryContext";

const STORAGE_KEY = "movieverse_user_preferences";

const DEFAULT_GENRES = [
  { id: 28, name: "Action", icon: "💥" },
  { id: 12, name: "Adventure", icon: "🗺️" },
  { id: 16, name: "Animation", icon: "🎬" },
  { id: 35, name: "Comedy", icon: "😂" },
  { id: 80, name: "Crime", icon: "🔪" },
  { id: 99, name: "Documentary", icon: "📹" },
  { id: 18, name: "Drama", icon: "🎭" },
  { id: 10751, name: "Family", icon: "👨‍👩‍👧" },
  { id: 14, name: "Fantasy", icon: "🧙" },
  { id: 36, name: "History", icon: "📜" },
  { id: 27, name: "Horror", icon: "👻" },
  { id: 10402, name: "Music", icon: "🎵" },
  { id: 9648, name: "Mystery", icon: "🔍" },
  { id: 10749, name: "Romance", icon: "💕" },
  { id: 878, name: "Sci-Fi", icon: "🚀" },
  { id: 10770, name: "TV Movie", icon: "📺" },
  { id: 53, name: "Thriller", icon: "😱" },
  { id: 10752, name: "War", icon: "⚔️" },
  { id: 37, name: "Western", icon: "🤠" },
];

export const AVAILABLE_GENRES = DEFAULT_GENRES;

const getStoredPreferences = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading preferences from localStorage:", e);
  }
  return null;
};

const savePreferences = (prefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("Error saving preferences to localStorage:", e);
  }
};

const initialPrefs = getStoredPreferences();

const UserPreferencesContext = createContext();

export const UserPreferencesProvider = ({ children }) => {
  const { isAuthenticated, isRegistrationFlow, setIsRegistrationFlow } = useAuth();
  const { watchLaterCount, loading: wlLoading } = useWatchLater();
  const { wishlistCount, loading: wishlistLoading } = useWishlist();
  const { historyCount, loading: historyLoading } = useWatchHistory();
  const [preferences, setPreferences] = useState(initialPrefs);
  const [hasOnboarded, setHasOnboarded] = useState(initialPrefs?.hasOnboarded || false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isLoading = wlLoading || wishlistLoading || historyLoading;
  const totalItems = watchLaterCount + wishlistCount + historyCount;

  useEffect(() => {
    // Show onboarding ONLY if:
    // 1. User is logged in
    // 2. Not already onboarded
    // 3. Data is loaded
    // 4. User has < 5 items total
    // 5. IT IS NOT A FRESH REGISTRATION SESSION
    if (isAuthenticated && !hasOnboarded && !isLoading && totalItems < 5 && !isRegistrationFlow) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [isAuthenticated, hasOnboarded, isLoading, totalItems, isRegistrationFlow]);

  useEffect(() => {
    const stored = getStoredPreferences();
    if (stored && !preferences) {
      setPreferences(stored);
      setHasOnboarded(stored.hasOnboarded);
    }
  }, []);

  useEffect(() => {
    if (preferences) {
      savePreferences(preferences);
    }
  }, [preferences]);

  const selectGenres = (genreIds) => {
    const newPrefs = {
      selectedGenres: genreIds,
      hasOnboarded: true,
      onboardingComplete: new Date().toISOString(),
    };
    setPreferences(newPrefs);
    setHasOnboarded(true);
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    const newPrefs = {
      selectedGenres: [],
      hasOnboarded: true,
      onboardingComplete: new Date().toISOString(),
    };
    setPreferences(newPrefs);
    setHasOnboarded(true);
    setShowOnboarding(false);
  };

  const resetPreferences = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPreferences(null);
    setHasOnboarded(false);
    setShowOnboarding(true);
  };

  const triggerOnboarding = () => {
    setShowOnboarding(true);
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        hasOnboarded,
        showOnboarding,
        selectGenres,
        skipOnboarding,
        resetPreferences,
        triggerOnboarding,
        selectedGenres: preferences?.selectedGenres || [],
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
};
