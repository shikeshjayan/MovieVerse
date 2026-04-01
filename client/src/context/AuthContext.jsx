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
        }
      } finally {
        setLoading(false);
      }
    };
    checkUserLoggedIn();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await apiClient.post("/auth/login", credentials);

      if (res.data) {
        // Save token for Socket.io (cannot use HTTP-only cookie for socket)
        // API calls use HTTP-only cookie (more secure)
        setUser(res.data.user);
        setIsRegistrationFlow(false);
        return { success: true, user: res.data.user };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Login failed";
      throw new Error(message);
    }
  };

  // ✅ 3. Register function (new users)
  const register = async (userData) => {
    try {
      const res = await apiClient.post("/auth/register", userData);
      if (res.data) {
        return {
          success: true,
          warning: res.data.warning,
          message: res.data.message,
        };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Registration failed";
      throw new Error(message);
    }
  };

  // ✅ 3. Logout function
  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout API failed", error);
    }
    localStorage.removeItem("movieverse_user_preferences");
    setUser(null);
    window.location.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black overflow-hidden">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full loading-pulse"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full loading-spin"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full loading-center-dot"></div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent loading-pulse">
              MovieVerse
            </h1>
            <p className="text-gray-400 text-sm font-medium tracking-widest loading-pulse">
              LOADING...
            </p>
          </div>
          
          <div className="flex gap-2 loading-dots">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl loading-glow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl loading-glow" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>
    );
  }

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
        setIsRegistrationFlow,
      }}>
      {children}
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
