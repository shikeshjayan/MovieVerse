// src/routes/AdminRoute.jsx
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
