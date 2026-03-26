import Sidebar from "../dashboard/components/Sidebar";
import Topbar from "../dashboard/components/Topbar";
import { Outlet } from "react-router-dom";

/**
 * DashboardLayout
 * --------------------------------------------------
 * Provides the main layout for the dashboard:
 * - Dark / Light theme support
 * - Mobile top navigation
 * - Desktop sidebar
 * - Main content area for nested routes (Outlet)
 */
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
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
