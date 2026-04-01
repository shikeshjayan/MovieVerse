/**
 * AdminRoute Component
 * 
 * Protected route wrapper that restricts access to admin users only.
 * Redirects unauthenticated users to login and non-admin users to dashboard.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AdminRoute = () => {
  const { user } = useAuth();

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but not admin → go to dashboard
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};
