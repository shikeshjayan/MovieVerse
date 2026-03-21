import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { ThemeContext } from "../context/ThemeProvider";
import Header from "../components/Header";
import Footer from "../components/Footer";

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <main
        className={`mt-16 sm:mt-20 pt-2 sm:pt-4 flex-1 max-w-screen w-full ${
          theme === "dark"
            ? "bg-[#0F172A] text-[#F1F5F9]"
            : "bg-[#F8FAFC] text-[#1E293B]"
        }`}
      >
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default RootLayout;
