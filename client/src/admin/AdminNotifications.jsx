import { useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import { Bell, Search, Check, CheckCheck, Trash2, RefreshCw, User, Mail, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "../ui/ConfirmModal";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRead, setFilterRead] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, id: null, title: "", message: "" });

  const fetchNotifications = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        apiClient.get("/admin/notifications"),
        apiClient.get("/admin/notifications/unread-count"),
      ]);
      
      setNotifications(notifsRes.data.data || []);
      setUnreadCount(countRes.data.unreadCount || 0);
} catch (err) {
      console.error("Failed to load notifications:", err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await apiClient.patch(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Marked as read");
    } catch (err) {
      console.error("Failed to mark as read:", err);
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch("/admin/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = (id) => {
    setDeleteModal({
      open: true,
      type: "single",
      id,
      title: "Delete Notification?",
      message: "This notification will be permanently deleted.",
    });
  };

  const deleteAllNotifications = () => {
    setDeleteModal({
      open: true,
      type: "all",
      id: null,
      title: "Delete All Notifications?",
      message: "All notifications will be permanently deleted. This action cannot be undone.",
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteModal.type === "single") {
        await apiClient.delete(`/admin/notifications/${deleteModal.id}`);
        setNotifications((prev) => prev.filter((n) => n._id !== deleteModal.id));
        const wasUnread = notifications.find((n) => n._id === deleteModal.id && !n.read);
        if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
        if (selectedNotification?._id === deleteModal.id) setSelectedNotification(null);
        toast.success("Notification deleted");
      } else {
        await apiClient.delete("/admin/notifications");
        setNotifications([]);
        setUnreadCount(0);
        setSelectedNotification(null);
        toast.success("All notifications deleted");
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast.error("Failed to delete notification");
    }
    setDeleteModal({ open: false, type: null, id: null, title: "", message: "" });
  };

  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch =
      notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRead = filterRead === "all" || 
      (filterRead === "unread" && !notif.read) || 
      (filterRead === "read" && notif.read);
    return matchesSearch && matchesRead;
  });

  const getTypeColor = (type) => {
    const colors = {
      login: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      logout: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      register: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      admin_action: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      system: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return colors[type] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
      {/* Header Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0064E0]/10 rounded-xl">
            <Bell className="w-6 h-6 text-[#0064E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#0064E0] text-white rounded-lg hover:bg-[#0073ff] disabled:opacity-50 disabled:cursor-not-allowed transition">
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
          <button
            onClick={deleteAllNotifications}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
            <Trash2 className="w-4 h-4" />
            Delete All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#0064E0] focus:border-transparent outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#0064E0] outline-none transition">
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700">
              <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No notifications found</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => setSelectedNotification(notif)}
                className={`p-4 bg-white dark:bg-[#1E293B] rounded-xl border cursor-pointer transition hover:shadow-md ${
                  !notif.read
                    ? "border-[#0064E0] dark:border-[#0064E0] bg-blue-50/50 dark:bg-blue-900/10"
                    : "border-gray-200 dark:border-gray-700"
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(notif.type)}`}>
                        {notif.type || "info"}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-[#0064E0] rounded-full"></span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{notif.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{notif.message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {formatDate(notif.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif._id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#0064E0] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                          title="Mark as read">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif._id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                        title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedNotification ? (
            <div className="sticky top-20 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(selectedNotification.type)}`}>
                  {selectedNotification.type || "info"}
                </span>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  ×
                </button>
              </div>
              
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {selectedNotification.title}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {selectedNotification.message}
              </p>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Details
                </h3>
                
                <div className="space-y-3">
                  {selectedNotification.username && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedNotification.username}</span>
                    </div>
                  )}

                  {selectedNotification.userEmail && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedNotification.userEmail}</span>
                    </div>
                  )}

                  {selectedNotification.role && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        selectedNotification.role === "admin" 
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {selectedNotification.role === "admin" ? "Admin" : "User"}
                      </span>
                    </div>
                  )}

                  {selectedNotification.ipAddress && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedNotification.ipAddress}</span>
                    </div>
                  )}

                  {selectedNotification.userAgent && (
                    <div className="flex items-start gap-3 text-sm">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-300 break-all">{selectedNotification.userAgent}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-sm">
                    <Bell className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {selectedNotification.read ? "Read" : "Unread"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatDate(selectedNotification.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  {!selectedNotification.read && (
                    <button
                      onClick={() => markAsRead(selectedNotification._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0064E0] text-white rounded-lg hover:bg-[#0073ff] transition">
                      <Check className="w-4 h-4" />
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(selectedNotification._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="sticky top-20 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Select a notification to view details</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: null, id: null, title: "", message: "" })}
        onConfirm={handleDeleteConfirm}
        title={deleteModal.title}
        message={deleteModal.message}
      />
    </div>
  );
};

export default AdminNotifications;
