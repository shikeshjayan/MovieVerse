import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeContext } from "../context/ThemeProvider";
import settingsDark from "../../public/settings.svg";
import settingsLight from "../../public/settings_white.svg";
const NotFound = () => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  // Button animation variants
  const buttonVariants = {
    rest: {
      scale: 1,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.98,
    },
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-center items-center px-4
        ${
          theme === "dark"
            ? "bg-[#312F2C] text-[#FAFAFA]"
            : "bg-[#ECF0FF] text-[#312F2C]"
        }
      `}
    >
      <h1 className="text-8xl md:text-9xl font-extrabold flex items-center gap-2">
        4
        <span className="relative">
          <img
            src={theme === "dark" ? settingsLight : settingsDark }
            className="w-20 h-20 md:w-32 md:h-32 animate-spin [animation-duration:2s]"
            aria-hidden="true"
          />
        </span>
        4
      </h1>

      <p className="text-3xl md:text-5xl mt-4 text-center font-light">
        Page Not Found
      </p>

      <p className="text-lg md:text-xl text-gray-400 mt-2 text-center max-w-md">
        Sorry, the page you're looking for doesn't exist.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {/* Home Button with Framer Motion */}
        <motion.button
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          Go to Home
        </motion.button>

        {/* Back Button with Framer Motion */}
        <motion.button
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          Go Back
        </motion.button>
      </div>
    </div>
  );
};

export default NotFound;
