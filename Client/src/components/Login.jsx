import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { loginSchema } from "../validation/authSchema";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "../context/ThemeProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import BlurImage from "../ui/BlurImage";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ForgotPasswordModal from "../ui/ForgotPasswordModal";

/**
 * Login Component (formerly Signin)
 * ----------------
 * Login form with:
 * - Email + password fields
 * - Remember Me (localStorage + sessionStorage)
 * - Password visibility toggle
 * - Password strength indicator
 * - Forgot password handler
 * - Redirect after login
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const [showForgotModal, setShowForgotModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: "onSubmit",
  });

  const passwordValue = watch("password");

  // ✅ Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    const savedPassword = sessionStorage.getItem("rememberPassword");

    if (savedEmail) {
      setValue("email", savedEmail);
      setRememberMe(true); // auto-check "Remember Me"
    }
    if (savedPassword) {
      setValue("password", savedPassword);
    }
  }, [setValue]);

  // ✅ Toggle password visibility
  const toggleVisibility = () => setShowPassword((prev) => !prev);

  // ✅ Password strength checker
  const checkStrength = (password) => {
    if (!password) return "";
    if (password.length < 6) return "Weak";
    if (
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    ) {
      return "Strong";
    }
    return "Medium";
  };

  // ✅ Update strength on password change
  useEffect(() => {
    setPasswordStrength(checkStrength(passwordValue));
  }, [passwordValue]);

  // ✅ Handle form submission
  const onSubmit = async (data) => {
    setErrorMessage("");
    try {
      const result = await login(data);

      if (result?.success) {
        if (rememberMe) {
          localStorage.setItem("rememberEmail", data.email);
        } else {
          localStorage.removeItem("rememberEmail");
        }
        const userRole = result.user.role;
        navigate(userRole === "admin" ? "/admin" : "/dashboard");
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Invalid email or password. Please try again.";
      setErrorMessage(message);
    }
  };

  // ✅ Handle forgot password (stub – server-side route not implemented yet)
  const handleForgotPassword = () => {
    const email = watch("email");
    if (!email) {
      setShowForgotModal(true);
      return;
    }
    setShowForgotModal(true);
  };

  const closeForgotModal = () => setShowForgotModal(false);

  return (
    <section
      className={`min-h-screen w-full flex items-center justify-center mx-auto ${
        theme === "dark"
          ? "bg-[#312F2C] text-[#ECF0FF]"
          : "bg-[#ECF0FF] text-[#312F2C]"
      }`}>
      <div className="bg-[#ECF0FF] w-full max-w-4xl h-[36rem] flex rounded shadow-lg overflow-hidden">
        {/* Left Side Image */}
        <div className="hidden md:block w-1/2 relative">
          <BlurImage
            src="/registerCover.jpg"
            alt="Login Cover"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h4 className="text-2xl font-semibold mb-6 text-blue-500">Login</h4>

          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-blue-300 font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                className={`border text-[#312F2C] border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border-red-500" : ""
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-blue-300 font-medium">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`border text-[#312F2C] border-blue-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={toggleVisibility}
                  className="absolute right-3 text-[#312F2C] focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? (
                    <img src="/open-eye.png" alt="" />
                  ) : (
                    <img src="/closed-eye.png" alt="" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
              {passwordStrength && (
                <p
                  className={`text-sm mt-1 ${
                    passwordStrength === "Weak"
                      ? "text-red-500"
                      : passwordStrength === "Medium"
                        ? "text-yellow-500"
                        : "text-green-500"
                  }`}>
                  Strength: {passwordStrength}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberMe" className="text-blue-500 text-sm">
                  Remember Me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-blue-500 text-sm hover:underline">
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isSubmitting}
              type="submit"
              className="mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Logging in..." : "Login"}
            </motion.button>
          </form>

          <div className="flex justify-center gap-2 mt-4 text-sm">
            <p className="text-gray-500">Don't have an account?</p>
            <Link to="/register" className="text-blue-500 hover:underline">
              Register
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </section>
  );
};

export default Login;
