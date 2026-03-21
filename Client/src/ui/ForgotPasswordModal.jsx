import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { ThemeContext } from "../context/ThemeProvider";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const newPassword = watch("newPassword", "");
  const confirmPassword = watch("confirmPassword", "");

  const getMatchStrength = () => {
    if (!confirmPassword) return null;
    if (confirmPassword === newPassword) return "Perfect Match";
    if (newPassword.startsWith(confirmPassword)) return "Partially Matching";
    return "Not Matching";
  };
  const matchStrength = getMatchStrength();

  const onSubmit = async (data) => {
    try {
      // 🔁 Replace with your actual API call
      // await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      console.log("Password change data:", data);
      reset();
      onClose();
    } catch (err) {
      console.error("Failed to change password", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`rounded-xl shadow-2xl p-8 w-full max-w-md relative transition-colors ${
          isDark ? "bg-[#1f1c18] text-[#FAFAFA]" : "bg-white text-[#312F2C]"
        }`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 text-xl transition-colors ${
            isDark
              ? "text-[#FAFAFA] hover:text-gray-300"
              : "text-gray-400 hover:text-gray-600"
          }`}
          aria-label="Close modal">
          ✕
        </button>

        {/* Title */}
        <h2
          className={`text-xl font-semibold mb-2 ${
            isDark ? "text-[#FAFAFA]" : "text-[#171717]"
          }`}>
          Change Password
        </h2>

        {/* Subtitle */}
        <p
          className={`text-sm mb-6 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}>
          Enter your current password to set a new one.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Current Password */}
          <PasswordField
            id="currentPassword"
            label="Current Password"
            show={showCurrent}
            onToggle={() => setShowCurrent((p) => !p)}
            register={register("currentPassword", {
              required: "Current password is required",
            })}
            error={errors.currentPassword}
            isDark={isDark}
          />

          {/* New Password */}
          <PasswordField
            id="newPassword"
            label="New Password"
            show={showNew}
            onToggle={() => setShowNew((p) => !p)}
            register={register("newPassword", {
              required: "New password is required",
              minLength: { value: 8, message: "Minimum 8 characters" },
            })}
            error={errors.newPassword}
            isDark={isDark}
          />

          {/* Confirm Password */}
          <PasswordField
            id="confirmPassword"
            label="Confirm New Password"
            show={showConfirm}
            onToggle={() => setShowConfirm((p) => !p)}
            register={register("confirmPassword", {
              required: "Please confirm your password",
              validate: (val) =>
                val === newPassword || "Passwords do not match",
            })}
            error={errors.confirmPassword}
            matchStrength={matchStrength}
            isDark={isDark}
          />

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className={`flex-1 py-2 rounded-lg border transition ${
                isDark
                  ? "border-gray-600 text-[#FAFAFA] hover:bg-[#312F2C]"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 rounded-lg bg-[#0064E0] text-white hover:bg-[#0073ff] disabled:bg-gray-400 transition">
              {isSubmitting ? "Saving..." : "Save Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Reusable password field ── */
const PasswordField = ({
  id,
  label,
  show,
  onToggle,
  register,
  error,
  matchStrength,
  isDark,
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-[#0064E0]">
      {label}
    </label>

    <div className="relative flex items-center">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={id}
        className={`border rounded-md px-3 py-2 w-full pr-10
          focus:outline-none focus:ring-2 focus:ring-blue-500 transition
          ${error ? "border-red-500" : "border-blue-300"}
          ${isDark ? "bg-[#312F2C] text-[#FAFAFA]" : "bg-white text-[#312F2C]"}
        `}
        {...register}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 focus:outline-none cursor-pointer"
        aria-label={show ? `Hide ${label}` : `Show ${label}`}>
        {show ? (
          <img src="/open-eye.png" alt="hide" className="w-5 h-5" />
        ) : (
          <img src="/closed-eye.png" alt="show" className="w-5 h-5" />
        )}
      </button>
    </div>

    {/* Validation error */}
    {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}

    {/* Match strength — confirm field only */}
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
);

export default ForgotPasswordModal;
