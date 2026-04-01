import { useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import { Users, RefreshCw, Clock, Mail, Activity } from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";

const AdminActiveUsers = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const fetchActiveUsers = async () => {
    try {
      const response = await apiClient.get("/admin/active-users");
      setActiveUsers(response.data.users || []);
    } catch (err) {
      console.error("Failed to load active users:", err);
      toast.error("Failed to load active users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveUsers();

    const getSocketUrl = () => {
      const envUrl = import.meta.env.VITE_API_URL;
      if (envUrl) {
        return envUrl.replace('/api', '');
      }
      return "https://movieverse-s4e9.onrender.com";
    };

    const socket = io(getSocketUrl(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
    });

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("active-users-update", (count) => {
      fetchActiveUsers();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatDuration = (date) => {
    const now = new Date();
    const connected = new Date(date);
    const diffMs = now - connected;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0064E0]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0064E0]/10 rounded-xl">
            <Users className="w-6 h-6 text-[#0064E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Users</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeUsers.length > 0 
                ? `${activeUsers.length} user${activeUsers.length === 1 ? '' : 's'} currently online` 
                : "No active users"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            socketConnected 
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${socketConnected ? "bg-green-500" : "bg-gray-400"}`}></span>
            {socketConnected ? "Live" : "Disconnected"}
          </span>
          <button
            onClick={fetchActiveUsers}
            className="p-2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            title="Refresh">
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Currently Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Session</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Today's Peak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
            </div>
          </div>
        </div>
      </div>

      {activeUsers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No users currently online</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Connected At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Session Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {activeUsers.map((user) => (
                  <tr key={user.socketId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0064E0]/10 rounded-full flex items-center justify-center">
                          <Mail className="w-4 h-4 text-[#0064E0]" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(user.connectedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDuration(user.connectedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActiveUsers;