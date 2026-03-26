import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { ThemeContext } from "../context/ThemeProvider";
import { useUserPreferences } from "../context/UserPreferencesContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GenrePickerModal from "../ui/GenrePickerModal";

/**
 * RootLayout
 * --------------------------------------------------
 * Main layout wrapper for the app:
 * - Displays the Header at the top
 * - Renders page content in Outlet
 * - Shows Footer at the bottom
 * - Applies dark/light theme styling
 */
const RootLayout = () => {
  const { theme } = useContext(ThemeContext);
  const { showOnboarding, triggerOnboarding, hasOnboarded, selectedGenres } = useUserPreferences();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0064E0] focus:text-white focus:rounded-lg focus:font-medium focus:transition-all"
      >
        Skip to main content
      </a>

      {/* Genre Onboarding Modal - shows for new users */}
      <GenrePickerModal isOpen={showOnboarding} />

      {/* Header - with hidden trigger button for testing */}
      <Header />

      {/* Main content area */}
      <main
        id="main-content"
        className="mt-14 sm:mt-14 pt-2 sm:pt-4 flex-1 max-w-screen w-full bg-[#F8FAFC] text-[#1E293B] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
      >
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default RootLayout;