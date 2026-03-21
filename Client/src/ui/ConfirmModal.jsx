import { useContext } from "react";
import { ThemeContext } from "../context/ThemeProvider";
import { motion } from "framer-motion";

/**
 * ConfirmModal Component
 * ----------------------
 * A simple confirmation dialog (modal) for destructive actions.
 *
 * Features:
 * - Only renders when `open` is true
 * - Full-screen dark overlay with fade-in
 * - Modal card with scale-up and fade-in
 * - Theme-aware styling (dark/light)
 * - Title and message text
 * - Animated Cancel and Remove buttons
 *
 * Props:
 * - `open` (boolean): Whether the modal is visible
 * - `title` (string): Modal title
 * - `message` (string): Confirmation message
 * - `onCancel` (function): Called when user clicks Cancel
 * - `onConfirm` (function): Called when user clicks Remove
 */
const ConfirmModal = ({ open, title, message, onCancel, onConfirm }) => {
  const { theme } = useContext(ThemeContext);

  // Don’t render anything if modal is closed
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className={`rounded-lg w-[90%] max-w-md p-6 shadow-lg
          ${
            theme === "dark"
              ? "bg-[#312F2C] text-[#FAFAFA]"
              : "bg-[#ECF0FF] text-[#312F2C]"
          }
        `}
      >
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="mb-6">{message}</p>

        <div className="flex justify-end gap-4">
          {/* Cancel button with hover/tap animation */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:text-blue-600"
          >
            Cancel
          </motion.button>

          {/* Remove button with hover/tap animation */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Remove
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmModal;
