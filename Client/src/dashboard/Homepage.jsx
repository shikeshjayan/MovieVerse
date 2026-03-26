import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../services/apiClient";
import { toast } from "sonner";
import { ToastMessages } from "../utils/toastConfig";

const Homepage = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
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

    const updatePromise = apiClient.patch("/users/update-profile", {
      username: newName,
    }).then((res) => {
      const data = res.data;
      if (!data.success)
        throw new Error(data.message || ToastMessages.AUTH.USERNAME_UPDATE_ERROR);
      setUser({
        ...user,
        username: data.data.username,
      });
      setNewName("");
      return data;
    });

    toast.promise(updatePromise, {
      loading: ToastMessages.AUTH.USERNAME_UPDATE_LOADING,
      success: () => ToastMessages.AUTH.USERNAME_UPDATE_SUCCESS,
      error: (err) => err.response?.data?.message || err.message || ToastMessages.AUTH.USERNAME_UPDATE_ERROR,
    });
  };

  const handlePasswordChange = () => {
    if (!newPassword.trim()) return toast.error(ToastMessages.VALIDATION.PASSWORD_EMPTY);
    if (newPassword.length < 6)
      return toast.error(ToastMessages.VALIDATION.PASSWORD_TOO_SHORT);
    setCurrentPasswordInput("");
    setModalMessage("Please enter your current password to confirm:");
    setModalOpen(true);
  };

  const confirmPasswordChange = async () => {
    setPasswordChanging(true);

    const updatePromise = apiClient.patch("/users/update-profile", {
      currentPassword: currentPasswordInput,
      newPassword,
    }).then((res) => {
      const data = res.data;
      if (!data.success)
        throw new Error(data.message || ToastMessages.AUTH.PASSWORD_UPDATE_ERROR);
      setNewPassword("");
      setCurrentPasswordInput("");
      return data;
    });

    toast.promise(updatePromise, {
      loading: ToastMessages.AUTH.PASSWORD_UPDATE_LOADING,
      success: () => ToastMessages.AUTH.PASSWORD_UPDATE_SUCCESS,
      error: (err) => err.response?.data?.message || ToastMessages.AUTH.PASSWORD_UPDATE_ERROR,
    });

    try {
      await updatePromise;
    } catch {
      // Error handled by toast.promise
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
          <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
            Change Username
          </h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new username"
            className="w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-blue-900 text-black dark:text-white placeholder-gray-400"
          />
          <button
            onClick={handleUsernameChange}
            className="mt-3 w-full py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors">
            Save Username
          </button>
        </motion.div>

        <motion.div
          className="p-5 rounded shadow hover:shadow-lg transition-all duration-200 bg-gray-100 dark:bg-blue-950"
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          transition={{ duration: 0.5, delay: 0.2 }}>
          <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
            Change Password
          </h3>
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
            <div className="p-6 rounded w-96 shadow-lg relative bg-gray-300 dark:bg-blue-950 text-gray-900 dark:text-blue-100">
              <p className="mb-4">{modalMessage}</p>

              

              {modalMessage.includes("current password") && (
                <input
                  type="password"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Current password"
                  className="w-full p-2 rounded-lg mb-4 bg-white dark:bg-blue-900 text-black dark:text-white placeholder-gray-400"
                />
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="py-1 px-3 bg-gray-100 dark:bg-blue-800 text-gray-900 dark:text-white rounded hover:bg-gray-600 dark:hover:bg-blue-700">
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
