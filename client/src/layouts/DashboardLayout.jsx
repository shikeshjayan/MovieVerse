/**
 * Dashboard Layout Component
 * 
 * Layout wrapper for user dashboard pages (watch history, wishlist, reviews, etc.).
 * Features responsive design with sidebar for desktop and topbar for mobile.
 */
import Sidebar from "../dashboard/components/Sidebar";
import Topbar from "../dashboard/components/Topbar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div
      className="flex flex-col md:flex-row md:h-screen bg-blue-100 text-[#10367D] dark:bg-blue-950 dark:text-[#EBEBEB]"
    >
      {/* Top navigation for mobile */}
      <Topbar />

      {/* Sidebar for desktop */}
      <Sidebar className="hidden md:block" />

      {/* Main content area (renders nested routes) */}
      <main className="flex-1 p-6 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
