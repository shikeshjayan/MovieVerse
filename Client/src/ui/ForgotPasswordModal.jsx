import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import apiClient from "../services/apiClient";
import BlurImage from "../ui/BlurImage";

const ForgotPasswordModal = ({ isOpen, onClose, prefilledEmail = "" }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEmail(prefilledEmail || "");
      setStatus("idle");
      setMessage("");
    }
  }, [isOpen, prefilledEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setStatus("success");
      setMessage("Reset link sent to your email!");
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Something went wrong.");
    }
  };

  const handleClose = () => {
    setEmail("");
    setStatus("idle");
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        className="relative z-10 w-full max-w-4xl h-[36rem] flex rounded shadow-2xl overflow-hidden mx-4 bg-[#ECF0FF] dark:bg-[#312F2C]"
      >
        <div className="hidden md:block w-1/2 relative">
          <BlurImage
            src="/registerCover.jpg"
            alt="Forgot Password Cover"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div
          className="w-full md:w-1/2 p-8 flex flex-col justify-center text-[#312F2C] dark:text-[#ECF0FF]"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
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
          </button>

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
                Email Sent!
              </h3>
              <p className="text-gray-500 mb-6">{message}</p>
              <button
                onClick={handleClose}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
              >
                Close
              </button>
            </motion.div>
          ) : (
            <>
              <h4 className="text-2xl font-semibold mb-2 text-blue-500">
                Forgot Password
              </h4>
              <p className="text-gray-500 text-sm mb-6">
                {prefilledEmail
                  ? "We'll send a reset link to your email."
                  : "Enter your email and we'll send you a reset link."}
              </p>

              {status === "error" && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="forgotEmail"
                    className="text-blue-300 font-medium"
                  >
                    Email
                  </label>
                  <input
                    id="forgotEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={!!prefilledEmail}
                    className={`border text-[#312F2C] border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      prefilledEmail ? "bg-gray-100" : ""
                    }`}
                  />
                  {prefilledEmail && (
                    <p className="text-gray-400 text-xs mt-1">
                      Email locked from login form
                    </p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={status === "loading"}
                  className="mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "Sending..." : "Send Reset Link"}
                </motion.button>
              </form>

              <div className="flex justify-center gap-2 mt-4 text-sm">
                <p className="text-gray-500">Remember your password?</p>
                <button
                  onClick={handleClose}
                  className="text-blue-500 hover:underline"
                >
                  Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
