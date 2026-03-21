import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "../validation/authSchema";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "../context/ThemeProvider";
import BlurImage from "../ui/BlurImage";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
/**
 * Register Component (formerly Signup)
 * ----------------
 * - Email/password sign-up with React Hook Form + Yup
 * - Password strength indicator
 * - Confirm password match indicator
 * - Form data persisted in localStorage (survives refresh)
 * - Clear form button to reset everything
 */
const Register = () => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const { register: registerUser } = useContext(AuthContext);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [matchStrength, setMatchStrength] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [isAdminFieldVisible, setIsAdminFieldVisible] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    control,
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      adminkey: "",
    },
  });

  const passwordValue = watch("password") || "";
  const confirmPasswordValue = watch("confirmPassword") || "";

  // ✅ Load saved form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("registerFormData");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.name) setValue("name", data.name);
        if (data.email) setValue("email", data.email);
        if (data.password) setValue("password", data.password);
        if (data.confirmPassword)
          setValue("confirmPassword", data.confirmPassword);
      } catch (e) {
        console.warn("Failed to parse saved registration data", e);
      }
    }
  }, [setValue]);

  // ✅ Save form values to localStorage whenever they change
  const name = useWatch({ control, name: "name" });
  const email = useWatch({ control, name: "email" });
  const password = useWatch({ control, name: "password" });
  const confirmPassword = useWatch({ control, name: "confirmPassword" });

  useEffect(() => {
    const data = { name, email, password, confirmPassword };
    localStorage.setItem("registerFormData", JSON.stringify(data));
  }, [name, email, password, confirmPassword]);

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

  // ✅ Progressive match indicator (password vs confirm password)
  useEffect(() => {
    setPasswordStrength(checkStrength(passwordValue));

    if (!confirmPasswordValue) {
      setMatchStrength("");
      return;
    }

    let matchCount = 0;
    for (let i = 0; i < confirmPasswordValue.length; i++) {
      if (passwordValue[i] === confirmPasswordValue[i]) {
        matchCount++;
      }
    }

    const similarity = (matchCount / passwordValue.length) * 100;

    if (
      similarity === 100 &&
      passwordValue.length === confirmPasswordValue.length
    ) {
      setMatchStrength("Perfect Match");
    } else if (similarity > 50) {
      setMatchStrength("Partially Matching");
    } else {
      setMatchStrength("No Match");
    }
  }, [passwordValue, confirmPasswordValue]);

  // ✅ Handle form submission
  const onSubmit = async (data) => {
    setErrorMessage("");
    try {
      const result = await registerUser({
        username: data.name,
        email: data.email,
        password: data.password,
        adminKey: data.adminkey,
      });

      if (result.success) {
        // ✅ Clear saved form data after successful registration
        localStorage.removeItem("registerFormData");

        navigate("/login", {
          replace: true,
          state: { success: "Account created. Please log in." },
        });
      }
      reset();
    } catch (error) {
      const backendMessage =
        error.response?.data?.message || "Sign up failed. Please try again.";
      setErrorMessage(backendMessage);

      console.error("Register Error:", error);
    }
  };

  return (
    <section
      className={`min-h-screen w-screen grid place-items-center ${
        theme === "dark"
          ? "bg-[#312F2C] text-[#ECF0FF]"
          : "bg-[#ECF0FF] text-[#312F2C]"
      }`}>
      <div className="bg-[#ECF0FF] w-full max-w-4xl min-h-[45rem] flex rounded-lg shadow-lg overflow-hidden">
        {/* Left side - Cover image */}
        <div className="hidden md:block w-1/2 relative bg-gray-200">
          <BlurImage
            src="/registerCover.jpg"
            alt="Register cover"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Right side - Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h4 className="text-2xl font-semibold mb-6 text-blue-500">
            Register
          </h4>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate>
            {/* Username */}
            <div className="flex flex-col gap-1">
              <label htmlFor="username" className="text-blue-500 font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className={`border text-[#312F2C] border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : ""
                }`}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-blue-500 font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`border text-[#312F2C] border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border-red-500" : ""
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-blue-500 font-medium">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="password"
                  className={`border text-[#312F2C] border-blue-300 rounded-md px-3 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? (
                    <img src="/open-eye.png" alt="show-password" />
                  ) : (
                    <img src="/closed-eye.png" alt="hide-password" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
              {passwordStrength && (
                <p
                  className={`text-xs mt-1 ${
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

            {/* Confirm Password */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="confirmPassword"
                className="text-blue-500 font-medium">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="confirmPassword"
                  className={`border text-[#312F2C] border-blue-300 rounded-md px-3 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 focus:outline-none cursor-pointer"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }>
                  {showConfirmPassword ? (
                    <img src="/open-eye.png" alt="show-password" />
                  ) : (
                    <img src="/closed-eye.png" alt="hide-password" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
              {matchStrength && (
                <p
                  className={`text-xs mt-1 ${
                    matchStrength === "Perfect Match"
                      ? "text-green-500"
                      : matchStrength === "Partially Matching"
                        ? "text-yellow-500"
                        : "text-red-500"
                  }`}>
                  {matchStrength}
                </p>
              )}
            </div>

            {/* Inline error message */}
            {errorMessage && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {errorMessage}
              </p>
            )}

            {/* -------------------------------------------------------- */}
            {/* Admin Key Toggle - Positioned Top Right */}
            <div className="flex justify-end mb-1">
              <button
                type="button"
                onClick={() => setIsAdminFieldVisible(!isAdminFieldVisible)}
                className="text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-red-500 transition-colors">
                {isAdminFieldVisible ? "Hide Key Field" : "Enter Admin Key?"}
              </button>
            </div>

            {/* The Input Box & Label (Both Conditionally Visible) */}
            {isAdminFieldVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col gap-1 overflow-hidden">
                {/* Label is now inside the visible block */}
                <label
                  htmlFor="adminkey"
                  className="text-blue-500 font-medium text-sm">
                  Admin Access
                </label>

                <div className="relative flex items-center">
                  <input
                    id="adminkey"
                    type={showAdminKey ? "text" : "password"}
                    className={`border text-[#312F2C] border-red-200 bg-red-50/30 rounded-md px-3 py-2 w-full pr-10 focus:outline-none focus:ring-1 focus:ring-red-400 transition-all ${
                      errors.adminkey ? "border-red-500" : ""
                    }`}
                    placeholder="Enter secret admin key"
                    {...register("adminkey")}
                  />

                  {/* Internal Toggle (Show/Hide Characters) */}
                  <button
                    type="button"
                    onClick={() => setShowAdminKey(!showAdminKey)}
                    className="absolute right-3 focus:outline-none cursor-pointer hover:scale-110 transition-transform"
                    aria-label={
                      showAdminKey ? "Hide characters" : "Show characters"
                    }>
                    <img
                      src={showAdminKey ? "/open-eye.png" : "/closed-eye.png"}
                      alt="toggle visibility"
                      className="w-4 h-4 opacity-60"
                    />
                  </button>
                </div>

                {errors.adminkey && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.adminkey.message}
                  </p>
                )}
              </motion.div>
            )}
            {/* -------------------------------------------------------- */}
            {/* Submit & Clear */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isSubmitting}
              type="submit"
              className="mt-4 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Creating..." : "Create Account"}
            </motion.button>

            <button
              type="button"
              onClick={() => {
                reset();
                localStorage.removeItem("registerFormData");
              }}
              className="text-sm text-gray-500 hover:text-red-700">
              Clear form
            </button>
          </form>

          {/* Bottom navigation */}
          <p className="text-gray-500 text-sm mt-4 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Register;
