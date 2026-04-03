/**
 * ConfirmModal Component
 * 
 * Reusable confirmation dialog with customizable title, message, and action buttons.
 * Supports backdrop click dismissal and customizable confirm button styling.
 */
import { motion } from "framer-motion";

/**
 * @param {boolean} open - Whether the modal is visible
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {function} onClose - Callback when modal should close
 * @param {function} [onCancel] - Cancel button callback
 * @param {function} onConfirm - Confirm button callback
 * @param {string} [confirmText="Confirm"] - Confirm button label
 * @param {string} [confirmStyle] - Tailwind classes for confirm button
 */
const ConfirmModal = ({ open, title, message, onClose, onCancel, onConfirm, confirmText = "Confirm", confirmStyle = "bg-red-600 hover:bg-red-700" }) => {
  if (!open) return null;

  const handleCancel = onCancel || onClose;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="rounded-lg w-[90%] max-w-md p-6 shadow-lg bg-[#ECF0FF] text-[#312F2C] dark:bg-[#312F2C] dark:text-[#FAFAFA]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className="text-lg font-semibold mb-2">{title}</h3>
        <p className="mb-6">{message}</p>

        <div className="flex justify-end gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCancel}
            className="px-4 py-2 border rounded hover:text-blue-600"
            aria-label="Cancel"
          >
            Cancel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded ${confirmStyle}`}
            aria-label={confirmText}
          >
            {confirmText}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmModal;
