import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

/**
 * Overview Component
 * ------------------
 * Landing page for unauthenticated users
 * - Redirects logged-in users to /home
 * - Hero section with animations
 * - Improved loading state
 * - Better background handling
 * - Accessible and responsive
 */

const Overview = () => {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect authenticated users
  if (user) return <Navigate to="/home" replace />;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.03,
      transition: { duration: 0.25, ease: "easeOut" },
    },
    tap: { scale: 0.97 },
  };

  return (
    <section
      role="main"
      className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Background Image */}
      <motion.div
        className="absolute inset-0 z-0 opacity-40 bg-[url('/over.jpg')] bg-cover bg-center"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8 }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/85 to-black"></div>

      {/* Navbar */}
      <header className="absolute top-0 left-0 w-full z-20 flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        <h1 className="text-white font-bold text-lg sm:text-xl tracking-wide">
          ▶ MovieVerse
        </h1>

        <div className="flex gap-4 sm:gap-6 text-gray-300 text-xs sm:text-sm">
          <Link to="/login" className="hover:text-white transition">
            Login
          </Link>
          <Link to="/register" className="hover:text-white transition">
            Register
          </Link>
        </div>
      </header>

      {/* Main Hero Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center text-white px-6">
        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="mb-4 text-sm sm:text-base tracking-widest uppercase text-blue-400">
          DISCOVER • TRACK • REVIEW
        </motion.p>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="mb-6 text-3xl sm:text-5xl lg:text-7xl font-extrabold leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Explore the Universe of Movies
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="mb-12 max-w-xl text-gray-300 text-lg sm:text-xl leading-relaxed">
          Discover movies, track your watchlist, and never miss your next
          favorite.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-5 w-full max-w-md">
          {/* Login Button */}
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className="w-full">
            <Link
              to="/home"
              aria-label="Login to your account"
              className="block w-full rounded-md px-8 py-4 text-lg font-semibold text-white 
              bg-linear-to-r from-blue-600 to-blue-700
              hover:from-blue-700 hover:to-blue-800
              transition-all duration-300 shadow-lg text-center">
              Start Exploring
            </Link>
          </motion.div>

          {/* Register Button */}
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className="w-full">
            <Link
              to="/register"
              aria-label="Create a new account"
              className="block w-full rounded-md px-8 py-4 text-lg font-semibold text-white 
              bg-white/10 backdrop-blur-md
              hover:bg-white/20
              border border-white/20
              transition-all duration-300 shadow-lg text-center">
              Create Account
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Overview;
