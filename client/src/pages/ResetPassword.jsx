import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import apiClient from "../services/apiClient";
import { ThemeContext } from "../context/ThemeProvider";
import BlurImage from "../ui/BlurImage";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");

  // ✅ NEW: validate token on page load
  const [tokenStatus, setTokenStatus] = useState("checking"); // checking | valid | invalid

  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }
    apiClient
      .get(`/auth/verify-reset-token?token=${token}`)
      .then(() => setTokenStatus("valid"))
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  const checkStrength = (password) => {
    if (!password) return "";
    if (password.length < 6) return "Weak";
    if (
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    )
      return "Strong";
    return "Medium";
  };

  useEffect(() => {
    setPasswordStrength(checkStrength(newPassword));
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setStatus("loading");
    try {
      await apiClient.post("/auth/reset-password", { token, newPassword });
      setStatus("success");
      setMessage("Password reset successfully!");
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Link is invalid or expired.");
    }
  };

  // ─── Token checking state ───────────────────────────────────────────
  if (tokenStatus === "checking") {
    return (
      <section
        className="min-h-screen w-full flex items-center justify-center bg-[#ECF0FF] text-[#312F2C] dark:bg-[#312F2C] dark:text-[#ECF0FF]"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Validating your reset link...</p>
        </div>
      </section>
    );
  }

  // ─── Invalid / expired token state ──────────────────────────────────
  if (tokenStatus === "invalid") {
    return (
      <section
        className="min-h-screen w-full flex items-center justify-center bg-[#ECF0FF] text-[#312F2C] dark:bg-[#312F2C] dark:text-[#ECF0FF]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#ECF0FF] rounded-xl shadow-lg p-10 max-w-sm w-full mx-4 text-center dark:bg-[#3d3a37]"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-500 mb-2">Link Expired</h3>
          <p className="text-gray-500 text-sm mb-6">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition w-full"
          >
            Back to Login
          </motion.button>
        </motion.div>
      </section>
    );
  }

  // ─── Main form (tokenStatus === "valid") ─────────────────────────────
  return (
    <section
      className="min-h-screen w-full flex items-center justify-center mx-auto bg-[#ECF0FF] text-[#312F2C] dark:bg-[#312F2C] dark:text-[#ECF0FF]"
    >
      <div className="bg-[#ECF0FF] w-full max-w-4xl h-[36rem] flex rounded shadow-lg overflow-hidden">
        {/* Left cover image */}
        <div className="hidden md:block w-1/2 relative">
          <BlurImage
            src="/registerCover.jpg"
            alt="Reset Password Cover"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Right form panel */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-500 mb-2">
                Success!
              </h3>
              <p className="text-gray-500 mb-6">{message}</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/login")}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
              >
                Go to Login
              </motion.button>
            </motion.div>
          ) : (
            <>
              <h4 className="text-2xl font-semibold mb-2 text-blue-500">
                Reset Password
              </h4>
              <p className="text-gray-500 text-sm mb-6">
                Create a new strong password for your account.
              </p>

              {status === "error" && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* New Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="newPassword" className="text-blue-300 font-medium">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="border text-[#312F2C] border-blue-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#312F2C] focus:outline-none cursor-pointer"
                    >
                      {showPassword ? (
                        <img src="/open-eye.png" alt="Hide" />
                      ) : (
                        <img src="/closed-eye.png" alt="Show" />
                      )}
                    </button>
                  </div>
                  {passwordStrength && (
                    <p
                      className={`text-sm mt-1 ${
                        passwordStrength === "Weak"
                          ? "text-red-500"
                          : passwordStrength === "Medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                      }`}
                    >
                      Strength: {passwordStrength}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="confirmPassword" className="text-blue-300 font-medium">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="border text-[#312F2C] border-blue-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-[#312F2C] focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <img src="/open-eye.png" alt="Hide" />
                      ) : (
                        <img src="/closed-eye.png" alt="Show" />
                      )}
                    </button>
                  </div>
                  {/* ✅ NEW: inline match indicator */}
                  {confirmPassword && (
                    <p
                      className={`text-sm mt-1 ${
                        newPassword === confirmPassword
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {newPassword === confirmPassword
                        ? "✓ Passwords match"
                        : "✗ Passwords do not match"}
                    </p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={
                    status === "loading" ||
                    newPassword !== confirmPassword ||  // ✅ disable if mismatch
                    passwordStrength === "Weak"         // ✅ disable if too weak
                  }
                  className="mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "Resetting..." : "Reset Password"}
                </motion.button>
              </form>

              <div className="flex justify-center gap-2 mt-4 text-sm">
                <p className="text-gray-500">Remember your password?</p>
                <Link to="/login" className="text-blue-500 hover:underline">
                  Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;