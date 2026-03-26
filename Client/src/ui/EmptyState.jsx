import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {icon && (
        <div className="w-24 h-24 mb-6 rounded-full bg-[#0064E0]/10 flex items-center justify-center">
          <FontAwesomeIcon icon={icon} className="w-12 h-12 text-[#0064E0]" />
        </div>
      )}
      
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>
      
      {actionLabel && (
        <Link
          to={actionLink || "/home"}
          onClick={onAction}
          className="px-6 py-3 rounded-xl bg-[#0064E0] text-white font-medium hover:bg-[#0073ff] transition"
        >
          {actionLabel}
        </Link>
      )}
    </motion.div>
  );
};

export default EmptyState;