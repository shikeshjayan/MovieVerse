import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../services/apiClient";

const Homepage = () => {
  const { user, setUser } = useAuth();
  console.log("USER:", user);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  if (!user) return <div className="p-6">Please log in first.</div>;

  const userData = user?.user;

  const showModal = (message, success = false) => {
    setModalMessage(message);
    setModalOpen(true);
    if (success) {
      setShowSuccessAnim(true);
      setTimeout(() => setShowSuccessAnim(false), 1200);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMessage("");
  };

  const getInitial = (name, email) => {
    if (name?.trim().length > 0) return name.trim().charAt(0).toUpperCase();
    return email ? email.charAt(0).toUpperCase() : "U";
  };

  const handleUsernameChange = async () => {
    if (!newName.trim()) return showModal("Username cannot be empty.");
    if (newName.trim().length < 3)
      return showModal("Username must be at least 3 characters.");

    try {
      const res = await apiClient.patch("/auth/update-profile", {
        username: newName,
      });

      const data = res.data;
      if (!data.success)
        throw new Error(data.message || "Failed to update username");

      setUser({
        ...user,
        user: { ...user.user, username: data.data.username },
      });

      setNewName("");
      showModal("Username updated successfully!", true);
    } catch (err) {
      console.error(err);
      showModal(
        err.response?.data?.message ||
          err.message ||
          "Failed to update username",
      );
    }
  };

  const handlePasswordChange = () => {
    if (!newPassword.trim()) return showModal("Password cannot be empty.");
    if (newPassword.length < 6)
      return showModal("Password must be at least 6 characters.");
    setCurrentPasswordInput("");
    setModalMessage("Please enter your current password to confirm:");
    setModalOpen(true);
  };

  const confirmPasswordChange = async () => {
    setPasswordChanging(true);
    try {
      const res = await apiClient.patch("/auth/update-profile", {
        currentPassword: currentPasswordInput,
        newPassword,
      });

      const data = res.data;
      if (!data.success)
        throw new Error(data.message || "Failed to update password");

      setNewPassword("");
      setCurrentPasswordInput("");
      showModal("Password updated successfully!", true);
    } catch (err) {
      console.error(err);
      showModal(err.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordChanging(false);
      setModalOpen(false);
    }
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const modalVariant = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  };

  const successAnimVariant = {
    hidden: { opacity: 0, y: 0, scale: 0.5 },
    visible: { opacity: 1, y: -30, scale: 1.2 },
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <motion.div
        className="flex flex-col sm:flex-row items-center gap-6 bg-gray-100 p-6 rounded shadow-lg"
        initial="hidden"
        animate="visible"
        variants={cardVariant}
        transition={{ duration: 0.5 }}>
        <div className="w-24 h-24 rounded-full border-4 border-blue-900 bg-blue-200 flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-900">
            {getInitial(userData?.username, userData?.email)}
          </span>
        </div>

        <div className="text-center sm:text-left mt-4 sm:mt-0">
          <h2 className="text-2xl font-bold text-blue-900">
            {userData?.username || "User"}
          </h2>
          <p className="text-blue-900">{userData?.email}</p>
          <span className="text-sm text-gray-500 capitalize">
            Role: {userData?.role || "user"}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <motion.div
          className="bg-gray-100 p-5 rounded shadow hover:shadow-lg transition-all duration-200"
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          transition={{ duration: 0.5, delay: 0.1 }}>
          <h3 className="text-lg font-semibold mb-4 text-blue-900">
            Change Username
          </h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new username"
            className="w-full p-3 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleUsernameChange}
            className="mt-3 w-full py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors">
            Save Username
          </button>
        </motion.div>

        <motion.div
          className="bg-gray-100 p-5 rounded shadow hover:shadow-lg transition-all duration-200"
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          transition={{ duration: 0.5, delay: 0.2 }}>
          <h3 className="text-lg font-semibold mb-4 text-blue-900">
            Change Password
          </h3>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full p-3 rounded text-black focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#312F2C] focus:outline-none cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? (
                <img src="/open-eye.png" alt="" className="w-5 h-5" />
              ) : (
                <img src="/closed-eye.png" alt="" className="w-5 h-5" />
              )}
            </button>
          </div>
          <button
            onClick={handlePasswordChange}
            className="mt-3 w-full py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors">
            Save Password
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariant}
            transition={{ duration: 0.25 }}>
            <div className="bg-gray-300 p-6 rounded w-96 text-gray-900 shadow-lg relative">
              <p className="mb-4">{modalMessage}</p>

              <AnimatePresence>
                {showSuccessAnim && (
                  <motion.div
                    className="absolute top-2 right-2 text-green-600 font-bold"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={successAnimVariant}
                    transition={{ duration: 1 }}>
                    ✔
                  </motion.div>
                )}
              </AnimatePresence>

              {modalMessage.includes("current password") && (
                <input
                  type="password"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Current password"
                  className="w-full p-2 rounded-lg text-black mb-4"
                />
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="py-1 px-3 bg-gray-100 rounded hover:bg-gray-600">
                  Cancel
                </button>

                {modalMessage.includes("current password") && (
                  <button
                    onClick={confirmPasswordChange}
                    className="py-1 px-3 bg-red-600 text-white rounded hover:bg-red-700"
                    disabled={passwordChanging}>
                    {passwordChanging ? "Saving..." : "Confirm"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Homepage;
