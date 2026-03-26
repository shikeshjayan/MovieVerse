import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useState } from "react";

const AdminStatCard = ({ label, value, subLabel, icon: Icon, color }) => {
  const motionCount = useMotionValue(0);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    const controls = animate(motionCount, value || 0, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayCount(Math.floor(latest)),
    });
    return () => controls.stop();
  }, [value, motionCount]);

  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <motion.div
      className={`bg-gradient-to-br ${colorClasses[color] || colorClasses.blue} p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">
            {displayCount.toLocaleString()}
          </p>
          {subLabel && (
            <p className="text-white/60 text-xs mt-1">{subLabel}</p>
          )}
        </div>
        {Icon && (
          <div className="bg-white/20 p-3 rounded-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminStatCard;
