import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SignOutModal from "../ui/SignOutModal";
import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeProvider";
import { motion } from "framer-motion";
/**
 * ProfileDropdown Component
 * Renders a dropdown menu for profile actions (My Space, Settings, Logout/Login).
 * Shows a confirmation modal before signing out.
 *
 * @param {boolean} isOpen - Whether the dropdown is visible
 * @param {Function} onClose - Function to close the dropdown
 */
const ProfileDropdown = ({ isOpen, onClose }) => {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Don’t render anything if dropdown is closed
  if (!isOpen) return null;

  return (
    <>
      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className={`absolute top-full right-0 mt-5 w-48 rounded-b shadow-lg py-2 z-50 font-sans text-s ${
          theme === "dark"
            ? "bg-[#312F2C] text-[#FAFAFA]"
            : "bg-[#ECF0FF] text-[#312F2C]"
        }`}>
        {/* Profile & Settings (only if logged in) */}
        {user && (
          <>
            <div
              onClick={() => {
                navigate("/dashboard");
                onClose();
              }}
              className="px-4 py-2 hover:text-[#0073ff] cursor-pointer">
              My Space
            </div>
            <div
              onClick={() => {
                navigate("dashboard/home");
                onClose();
              }}
              className="px-4 py-2 hover:text-[#0073ff] cursor-pointer">
              Settings
            </div>
            <div className="border-t border-gray-100 my-1"></div>
          </>
        )}

        {/* Logout / Login Button */}
        <div
          onClick={() => {
            if (user) {
              setShowSignOutModal(true); // Show confirmation modal
            } else {
              navigate("/login");
              onClose();
            }
          }}
          className={`px-4 py-2 cursor-pointer font-medium ${
            user
              ? "text-[#e00000] hover:text-[#ff0000]"
              : "text-[#0064E0] hover:text-[#0073ff]"
          }`}>
          {user ? "Logout" : "Login"}
        </div>
      </motion.div>
    </>
  );
};

export default ProfileDropdown;
