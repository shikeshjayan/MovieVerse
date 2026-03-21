import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * StatCard
 * --------------------------------------------------
 * Reusable card displaying:
 * - Label
 * - Smoothly animated count from 0 → target
 */
const StatCard = ({ label, count, bgColor, textColor }) => {
  const motionCount = useMotionValue(0);
  const [displayCount, setDisplayCount] = useState(0);

  // Smoothly animate count whenever it changes
  useEffect(() => {
    const controls = animate(motionCount, count, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayCount(Math.floor(latest)),
    });

    return () => controls.stop(); // Cleanup
  }, [count, motionCount]);

  return (
    <motion.div
      className={`flex flex-col items-center justify-center h-32 rounded-lg shadow-md hover:shadow-lg transition ${bgColor} ${textColor}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-sm opacity-90">{label}</p>

      <p className="text-3xl font-bold">{displayCount}</p>
    </motion.div>
  );
};

export default StatCard;
