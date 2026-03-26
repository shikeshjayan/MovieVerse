import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../services/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistrationFlow, setIsRegistrationFlow] = useState(false);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const response = await apiClient.get("/auth/me");
        setUser(response.data.user);
        setIsRegistrationFlow(false);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          setUser(null);
          console.log("No active session found (Guest mode).");
        } else {
          console.error("Auth check failed:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    checkUserLoggedIn();
  }, []);

  const login = async (credentials) => {
    const res = await apiClient.post("/auth/login", credentials);

    if (res.data) {
      setUser(res.data.user);
      setIsRegistrationFlow(false); 
      return { success: true, user: res.data.user };
    }
  };

  // ✅ 3. Register function (new users)
  const register = async (userData) => {
    const res = await apiClient.post("/auth/register", userData);
    if (res.data) {
      localStorage.removeItem("movieverse_user_preferences"); // Clear any stale guest preferences
      setUser(res.data.user);
      setIsRegistrationFlow(true);
      return { success: true };
    }
  };

  // ✅ 3. Logout function
  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
      localStorage.removeItem("movieverse_user_preferences"); // Clear preferences for fresh login
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
        isRegistrationFlow,
        setIsRegistrationFlow
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
