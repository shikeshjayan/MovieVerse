import { useContext } from "react";
import { ThemeContext } from "../context/ThemeProvider";
import Sidebar from "../admin/components/Sidebar";
import Topbar from "../admin/components/Topbar";
import { Outlet } from "react-router-dom";
const DashboardLayout = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <div
      className={`flex flex-col md:flex-row md:h-screen ${
        theme === "dark"
          ? "bg-blue-950 text-[#EBEBEB]"
          : "bg-blue-100 text-[#10367D]"
      }`}>
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
