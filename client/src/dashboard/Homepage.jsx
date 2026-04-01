/**
 * User Profile Settings Page
 * 
 * Allows users to update their profile including:
 * - Avatar image upload
 * - Username changes
 * - Password changes with current password confirmation
 */
import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import apiClient from "../services/apiClient";
import { toast } from "sonner";
import { ToastMessages } from "../utils/toastConfig";
import PasswordChangeModal from "./components/PasswordChangeModal";

const Homepage = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [usernameChanging, setUsernameChanging] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!user) return <div className="p-6">Please log in first.</div>;

  const userData = user;

  const closeModal = () => {
    setModalOpen(false);
    setModalMessage("");
  };

  const getInitial = (name, email) => {
    if (name?.trim().length > 0) return name.trim().charAt(0).toUpperCase();
    return email ? email.charAt(0).toUpperCase() : "U";
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return toast.error("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image size must be less than 5MB");
    }

    setUploadingAvatar(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result;

        try {
          const res = await apiClient.patch("/users/update-profile", {
            avatar: base64Image,
          });
          
          const data = res.data;
          if (data.success) {
            setUser({ ...user, avatar: data.data.avatar });
            setAvatarPreview(data.data.avatar);
            toast.success("Avatar updated successfully");
          } else {
            toast.error(data.message || "Failed to update avatar");
          }
        } catch (apiError) {
          console.error("Avatar update error:", apiError);
          toast.error(apiError.response?.data?.message || "Failed to update avatar");
        } finally {
          setUploadingAvatar(false);
        }
      };
      reader.onerror = () => {
        setUploadingAvatar(false);
        toast.error("Failed to read image file");
      };
    } catch (error) {
      setUploadingAvatar(false);
      console.error("Avatar change error:", error);
      toast.error("Failed to process image");
    }
  };

  const handleUsernameChange = async () => {
    if (!newName.trim()) return toast.error(ToastMessages.VALIDATION.USERNAME_EMPTY);
    if (newName.trim().length < 3)
      return toast.error(ToastMessages.VALIDATION.USERNAME_TOO_SHORT);

    setUsernameChanging(true);

    try {
      const res = await apiClient.patch("/users/update-profile", {
        username: newName,
      });
      const data = res.data;
      
      if (!data.success) {
        throw new Error(data.message || ToastMessages.AUTH.USERNAME_UPDATE_ERROR);
      }
      
      setUser({
        ...user,
        username: data.data.username,
      });
      setNewName("");
      toast.success(ToastMessages.AUTH.USERNAME_UPDATE_SUCCESS);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || ToastMessages.AUTH.USERNAME_UPDATE_ERROR);
    } finally {
      setUsernameChanging(false);
    }
  };

  const validatePassword = (password) => {
    if (!password) return { valid: false, message: "Password is required" };
    if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must contain at least one uppercase letter" };
    if (!/[a-z]/.test(password)) return { valid: false, message: "Password must contain at least one lowercase letter" };
    if (!/[0-9]/.test(password)) return { valid: false, message: "Password must contain at least one number" };
    return { valid: true };
  };

  const handlePasswordChange = () => {
    const validation = validatePassword(newPassword);
    if (!validation.valid) return toast.error(validation.message);
    setCurrentPasswordInput("");
    setModalMessage("Please enter your current password to confirm:");
    setModalOpen(true);
  };

  const confirmPasswordChange = async (currentPassword = currentPasswordInput) => {
    setPasswordChanging(true);

    try {
      const res = await apiClient.patch("/users/update-profile", {
        currentPassword,
        newPassword,
      });
      const data = res.data;
      
      if (!data.success) {
        throw new Error(data.message || ToastMessages.AUTH.PASSWORD_UPDATE_ERROR);
      }
      
      setNewPassword("");
      setCurrentPasswordInput("");
      toast.success(ToastMessages.AUTH.PASSWORD_UPDATE_SUCCESS);
    } catch (err) {
      toast.error(err.response?.data?.message || ToastMessages.AUTH.PASSWORD_UPDATE_ERROR);
    } finally {
      setPasswordChanging(false);
      setModalOpen(false);
    }
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <motion.div
        className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded shadow-lg bg-gray-100 dark:bg-blue-950"
        initial="hidden"
        animate="visible"
        variants={cardVariant}
        transition={{ duration: 0.5 }}>
        <div className="relative w-24 h-24 rounded-full border-4 border-blue-900 dark:border-blue-700 flex items-center justify-center overflow-hidden">
          {avatarPreview || userData?.avatar ? (
            <img 
              src={avatarPreview || userData?.avatar} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {getInitial(userData?.username, userData?.email)}
            </span>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors"
            title="Change avatar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="text-center sm:text-left mt-4 sm:mt-0">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {userData?.username || "User"}
          </h2>
          <p className="text-blue-900 dark:text-blue-200">{userData?.email}</p>
          <span className="text-sm capitalize text-gray-500 dark:text-blue-300">
            Role: {userData?.role || "user"}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <motion.div
          className="p-5 rounded shadow hover:shadow-lg transition-all duration-200 bg-gray-100 dark:bg-blue-950"
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Change Username
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-blue-300 mb-3">
            Current: <span className="font-medium">{userData?.username}</span>
          </p>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new username"
            className="w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-blue-900 text-black dark:text-white placeholder-gray-400"
          />
          <p className="text-xs text-gray-500 dark:text-blue-400 mt-2">
            Min 3 characters, letters, numbers, underscores only
          </p>
          <button
            onClick={handleUsernameChange}
            className="mt-3 w-full py-2.5 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newName.trim() || usernameChanging}>
            {usernameChanging ? "Saving..." : "Save Username"}
          </button>
        </motion.div>

        <motion.div
          className="p-5 rounded shadow hover:shadow-lg transition-all duration-200 bg-gray-100 dark:bg-blue-950"
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Change Password
            </h3>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-red-500 pr-10 bg-white dark:bg-blue-900 text-black dark:text-white placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none cursor-pointer text-[#312F2C] dark:text-blue-200"
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? (
                <img src="/open-eye.png" alt="" className="w-5 h-5" />
              ) : (
                <img src="/closed-eye.png" alt="" className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-blue-400 mt-2">
            Min 8 characters with uppercase, lowercase & number
          </p>
          <button
            onClick={handlePasswordChange}
            className="mt-3 w-full py-2.5 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newPassword.trim() || passwordChanging}>
            {passwordChanging ? "Saving..." : "Save Password"}
          </button>
        </motion.div>
      </div>

      <PasswordChangeModal
        isOpen={modalOpen && modalMessage.includes("current password")}
        onClose={closeModal}
        onConfirm={(password) => {
          confirmPasswordChange(password);
        }}
        isLoading={passwordChanging}
      />
    </div>
  );
};

export default Homepage;
