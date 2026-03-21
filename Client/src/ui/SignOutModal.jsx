import { createPortal } from "react-dom"; // Import Portal
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeProvider";
import { useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

const SignOutModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const { logout } = useAuth();

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Failed to sign out. Please try again.");
    } finally {
      onClose();
    }
  };

  // We wrap the modal in AnimatePresence to handle the 'exit' animation
  // And use createPortal to move it to document.body
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose} // Close if clicking outside
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className={`relative z-10 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border ${
              theme === "dark"
                ? "bg-[#1A1917] text-[#FAFAFA] border-gray-800"
                : "bg-[#FFFFFF] text-[#312F2C] border-gray-200"
            }`}>
            <div className="mb-4 flex justify-center text-red-500">
              {/* Optional: Add a logout icon here */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold mb-2">Confirm Sign Out</h3>
            <p
              className={`mb-8 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Are you sure you want to sign out? You'll need to log back in to
              access your profile.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={`px-6 py-2.5 rounded-xl font-semibold order-2 sm:order-1 transition-colors ${
                  theme === "dark"
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}>
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold order-1 sm:order-2 hover:bg-red-700 shadow-lg shadow-red-600/20">
                Sign Out
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default SignOutModal;
